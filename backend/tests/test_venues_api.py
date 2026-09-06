import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_nearby_venues_default(client: AsyncClient):
    response = await client.get("/api/v1/venues/nearby?lat=59.9139&lon=10.7522&radius_meters=3000")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    first = data[0]
    assert "id" in first
    assert "name" in first
    assert "vibe" in first
    assert "distance_meters" in first
    assert first["vibe"]["overall_status"] in ["optimal", "moderate", "packed"]


@pytest.mark.asyncio
async def test_get_nearby_venues_filters(client: AsyncClient):
    # Filter by libraries only
    response = await client.get("/api/v1/venues/nearby?lat=59.9139&lon=10.7522&radius_meters=5000&place_type=library")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    for venue in data:
        assert venue["place_type"] == "library"


@pytest.mark.asyncio
async def test_get_venue_detail_existing(client: AsyncClient):
    # Fetch Deichman Bjørvika
    response = await client.get("/api/v1/venues/11111111-0001-0000-0000-000000000001")
    assert response.status_code == 200
    data = response.json()
    assert data["name"].startswith("Deichman")
    assert "recent_checkins" in data
    assert len(data["recent_checkins"]) > 0


@pytest.mark.asyncio
async def test_get_venue_detail_not_found(client: AsyncClient):
    response = await client.get("/api/v1/venues/non-existent-id")
    assert response.status_code == 404
