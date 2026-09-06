import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_submit_checkin_and_vibe_update(client: AsyncClient):
    venue_id = "11111111-0004-0000-0000-000000000004"  # Sentralen

    payload = {
        "seat_level": 1,  # Empty
        "noise_level": 1,  # Silent
        "outlets_available": True,
        "comment": "Plenty of empty tables with chargers right now!",
    }

    # Submit check-in
    response = await client.post(f"/api/v1/venues/{venue_id}/checkin", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["venue_id"] == venue_id
    assert data["seat_level"] == 1
    assert data["noise_level"] == 1
    assert data["outlets_available"] is True

    # Check updated venue detail
    detail_res = await client.get(f"/api/v1/venues/{venue_id}")
    assert detail_res.status_code == 200
    venue_detail = detail_res.json()
    vibe = venue_detail["vibe"]

    # Vibe should now be optimal and live
    assert vibe["is_live"] is True
    assert vibe["overall_status"] == "optimal"
    assert vibe["seat_score"] == 1.0
    assert vibe["noise_score"] == 1.0


@pytest.mark.asyncio
async def test_log_speed_test(client: AsyncClient):
    venue_id = "11111111-0002-0000-0000-000000000002"  # Fuglen

    payload = {
        "download_mbps": 125.5,
        "ping_ms": 8.4,
        "network_ssid": "Fuglen-Guest",
    }

    response = await client.post(f"/api/v1/venues/{venue_id}/speedtest", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["venue_id"] == venue_id
    assert data["download_mbps"] == 125.5
    assert data["ping_ms"] == 8.4
