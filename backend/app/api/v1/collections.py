from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import SavedCollection, Venue
from app.schemas.collection import CollectionCreate, CollectionResponse
from app.schemas.venue import VenueResponse
from app.services.decay_engine import compute_venue_vibe

router = APIRouter()


@router.get("", response_model=List[CollectionResponse])
async def list_collections(
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns curated collections plus any custom collections created by the user.
    """
    query = select(SavedCollection).order_by(SavedCollection.is_curated.desc(), SavedCollection.created_at.desc())
    if user_id:
        query = query.where(
            (SavedCollection.is_curated == True) | (SavedCollection.user_id == user_id)
        )
    else:
        query = query.where(SavedCollection.is_curated == True)

    res = await db.execute(query)
    collections = res.scalars().all()
    return collections


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    payload: CollectionCreate,
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new custom saved collection list.
    """
    col = SavedCollection(
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        emoji=payload.emoji or "📍",
        tag=payload.tag,
        venue_ids=payload.venue_ids or [],
        is_curated=payload.is_curated,
    )
    db.add(col)
    await db.commit()
    await db.refresh(col)
    return col


@router.get("/{collection_id}/venues", response_model=List[VenueResponse])
async def get_collection_venues(
    collection_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches all venues inside a collection with calculated live vibe scores.
    """
    col_res = await db.execute(
        select(SavedCollection).where(SavedCollection.id == collection_id)
    )
    collection = col_res.scalars().first()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found.",
        )

    venue_ids = collection.venue_ids or []
    if not venue_ids:
        return []

    venues_res = await db.execute(
        select(Venue)
        .options(
            selectinload(Venue.checkins),
            selectinload(Venue.speed_tests),
        )
        .where(Venue.id.in_(venue_ids))
    )
    venues = venues_res.scalars().all()

    results = []
    for v in venues:
        vibe = compute_venue_vibe(v, v.checkins, v.speed_tests)
        results.append(
            VenueResponse(
                **v.to_dict(),
                vibe=vibe,
                distance_meters=None,
            )
        )

    return results
