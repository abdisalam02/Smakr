from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Venue, LiveCheckin
from app.schemas.checkin import CheckinCreate, CheckinResponse
from app.schemas.venue import VibeMetrics
from app.services.decay_engine import compute_venue_vibe
from app.services.event_broker import broker

router = APIRouter()


@router.post("/venues/{venue_id}/checkin", response_model=CheckinResponse, status_code=status.HTTP_201_CREATED)
async def submit_checkin(
    venue_id: str,
    payload: CheckinCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Submits a 30-second live check-in (Seats, Noise, Outlets).
    Immediately recalculates the venue's live vibe score and broadcasts
    the updated state to all connected WebSockets via Redis Pub/Sub.
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

    # Create new check-in record
    checkin = LiveCheckin(
        venue_id=venue_id,
        user_id=payload.user_id,
        seat_level=payload.seat_level,
        noise_level=payload.noise_level,
        outlets_available=payload.outlets_available,
        comment=payload.comment,
        created_at=datetime.utcnow(),
    )
    db.add(checkin)
    await db.commit()
    await db.refresh(checkin)

    # Recompute live vibe with the new check-in included
    updated_checkins = [checkin] + list(venue.checkins)
    updated_vibe = compute_venue_vibe(venue, updated_checkins, venue.speed_tests)

    # Publish live event to Redis / WebSockets
    await broker.publish_event(
        event_type="vibe_updated",
        data={
            "venue_id": venue_id,
            "venue_name": venue.name,
            "vibe": updated_vibe.model_dump(mode="json"),
            "new_checkin": checkin.to_dict(),
        },
    )

    return checkin


@router.get("/venues/{venue_id}/checkins", response_model=List[CheckinResponse])
async def list_venue_checkins(
    venue_id: str,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns recent checkin history for a specific venue.
    """
    query = (
        select(LiveCheckin)
        .where(LiveCheckin.venue_id == venue_id)
        .order_by(LiveCheckin.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(query)
    checkins = res.scalars().all()
    return checkins
