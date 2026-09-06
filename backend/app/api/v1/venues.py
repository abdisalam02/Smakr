from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Venue, LiveCheckin, WifiSpeedTest
from app.schemas.venue import (
    VenueResponse,
    VenueDetailResponse,
    VenueCreate,
    VibeMetrics,
)
from app.services.decay_engine import compute_venue_vibe
from app.services.spatial import apply_spatial_filter, get_bounding_box

router = APIRouter()


@router.get("/nearby", response_model=List[VenueResponse])
async def get_nearby_venues(
    lat: float = Query(59.9139, description="Center latitude (e.g. Oslo 59.9139)"),
    lon: float = Query(10.7522, description="Center longitude (e.g. Oslo 10.7522)"),
    radius_meters: float = Query(5000.0, ge=100.0, le=50000.0, description="Radius in meters"),
    place_type: Optional[str] = Query(None, description="cafe | library | coworking | hotel_lobby"),
    has_wifi: Optional[bool] = Query(None),
    has_outlets: Optional[bool] = Query(None),
    silent_zone: Optional[bool] = Query(None),
    open_late: Optional[bool] = Query(None),
    outdoor_seating: Optional[bool] = Query(None),
    dog_friendly: Optional[bool] = Query(None),
    min_download_mbps: Optional[float] = Query(None),
    vibe_status: Optional[str] = Query(None, description="'optimal' | 'moderate' | 'packed'"),
    db: AsyncSession = Depends(get_db),
):
    """
    Geospatial search endpoint returning spots within a radius,
    with dynamically computed time-decayed vibe scores (🟢 Optimal, 🟡 Moderate, 🔴 Packed).
    """
    min_lat, max_lat, min_lon, max_lon = get_bounding_box(lat, lon, radius_meters)

    # Base query with bounding box and relationships eager loaded
    query = (
        select(Venue)
        .options(
            selectinload(Venue.checkins),
            selectinload(Venue.speed_tests),
        )
        .where(
            Venue.latitude.between(min_lat, max_lat),
            Venue.longitude.between(min_lon, max_lon),
        )
    )

    # Apply database-level filters
    if place_type:
        query = query.where(Venue.place_type == place_type)
    if has_wifi is not None:
        query = query.where(Venue.has_wifi == has_wifi)
    if has_outlets is not None:
        query = query.where(Venue.has_outlets == has_outlets)
    if silent_zone is not None:
        query = query.where(Venue.silent_zone == silent_zone)
    if open_late is not None:
        query = query.where(Venue.open_late == open_late)
    if outdoor_seating is not None:
        query = query.where(Venue.outdoor_seating == outdoor_seating)
    if dog_friendly is not None:
        query = query.where(Venue.dog_friendly == dog_friendly)

    res = await db.execute(query)
    candidates = res.scalars().all()

    # Precise Haversine distance filtering and sorting
    filtered_with_dist = apply_spatial_filter(candidates, lat, lon, radius_meters)

    results = []
    for venue, dist in filtered_with_dist:
        vibe = compute_venue_vibe(venue, venue.checkins, venue.speed_tests)

        # Filter by calculated vibe status if requested
        if vibe_status and vibe.overall_status != vibe_status.lower():
            continue

        # Filter by speed test average if requested
        if min_download_mbps is not None:
            if vibe.avg_download_mbps is None or vibe.avg_download_mbps < min_download_mbps:
                continue

        venue_dict = venue.to_dict()
        results.append(
            VenueResponse(
                **venue_dict,
                vibe=vibe,
                distance_meters=dist,
            )
        )

    return results


@router.get("/{venue_id}", response_model=VenueDetailResponse)
async def get_venue_detail(
    venue_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches venue details with active vibe calculation, recent checkin history,
    and verified WiFi speed tests.
    """
    query = (
        select(Venue)
        .options(
            selectinload(Venue.checkins),
            selectinload(Venue.speed_tests),
        )
        .where(Venue.id == venue_id)
    )
    res = await db.execute(query)
    venue = res.scalars().first()

    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue with id '{venue_id}' not found.",
        )

    vibe = compute_venue_vibe(venue, venue.checkins, venue.speed_tests)
    recent_checkins = [c.to_dict() for c in venue.checkins[:20]]
    recent_speed_tests = [s.to_dict() for s in venue.speed_tests[:10]]

    return VenueDetailResponse(
        **venue.to_dict(),
        vibe=vibe,
        recent_checkins=recent_checkins,
        recent_speed_tests=recent_speed_tests,
    )


@router.post("", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
async def create_venue(
    payload: VenueCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new study/work spot in the database.
    """
    venue = Venue(**payload.model_dump())
    db.add(venue)
    await db.commit()
    await db.refresh(venue)

    vibe = compute_venue_vibe(venue, [])
    return VenueResponse(
        **venue.to_dict(),
        vibe=vibe,
        distance_meters=0.0,
    )
