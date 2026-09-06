import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Venue, WifiSpeedTest
from app.schemas.speedtest import SpeedTestCreate, SpeedTestResponse
from app.services.decay_engine import compute_venue_vibe
from app.services.event_broker import broker

router = APIRouter()

# Pre-generate 1MB test chunk for fast delivery
DUMMY_CHUNK = b"0123456789abcdef" * (64 * 1024)  # 1MB payload


@router.get("/speedtest/ping")
async def ping_speedtest():
    """
    Lightweight endpoint for testing network latency (RTT).
    """
    return {
        "status": "ok",
        "server_time_ms": int(time.time() * 1000),
    }


@router.get("/speedtest/payload")
async def get_speedtest_payload(
    size_kb: int = Query(1024, ge=64, le=10240, description="Payload size in KB"),
):
    """
    Returns calibrated byte payload for in-browser download speed measurement.
    """
    target_bytes = size_kb * 1024
    # Slice or repeat dummy chunk
    if target_bytes <= len(DUMMY_CHUNK):
        content = DUMMY_CHUNK[:target_bytes]
    else:
        multiplier = (target_bytes // len(DUMMY_CHUNK)) + 1
        content = (DUMMY_CHUNK * multiplier)[:target_bytes]

    return Response(
        content=content,
        media_type="application/octet-stream",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Content-Length": str(len(content)),
        },
    )


@router.post("/venues/{venue_id}/speedtest", response_model=SpeedTestResponse, status_code=status.HTTP_201_CREATED)
async def log_speed_test(
    venue_id: str,
    payload: SpeedTestCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Logs an in-browser measured WiFi speed test result and broadcasts the updated venue stats.
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

    speed_test = WifiSpeedTest(
        venue_id=venue_id,
        download_mbps=payload.download_mbps,
        ping_ms=payload.ping_ms,
        network_ssid=payload.network_ssid,
        created_at=datetime.utcnow(),
    )
    db.add(speed_test)
    await db.commit()
    await db.refresh(speed_test)

    # Recompute live vibe with updated speed test
    updated_tests = [speed_test] + list(venue.speed_tests)
    updated_vibe = compute_venue_vibe(venue, venue.checkins, updated_tests)

    # Broadcast event
    await broker.publish_event(
        event_type="speedtest_logged",
        data={
            "venue_id": venue_id,
            "venue_name": venue.name,
            "speed_test": speed_test.to_dict(),
            "vibe": updated_vibe.model_dump(mode="json"),
        },
    )

    return speed_test
