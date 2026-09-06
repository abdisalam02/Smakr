import pytest
from app.services.spatial import haversine_distance, get_bounding_box, apply_spatial_filter
from app.models import Venue


def test_haversine_distance_oslo():
    # Distance between Oslo S (59.9112, 10.7522) and Deichman Bjørvika (59.9079, 10.7533)
    # Approx 370 - 400 meters
    oslo_s_lat, oslo_s_lon = 59.9112, 10.7522
    deichman_lat, deichman_lon = 59.9079, 10.7533

    dist = haversine_distance(oslo_s_lat, oslo_s_lon, deichman_lat, deichman_lon)
    assert 350.0 < dist < 450.0


def test_bounding_box_contains_target():
    center_lat, center_lon = 59.9139, 10.7522
    radius = 2000.0  # 2km

    min_lat, max_lat, min_lon, max_lon = get_bounding_box(center_lat, center_lon, radius)

    # Center must be inside bounding box
    assert min_lat < center_lat < max_lat
    assert min_lon < center_lon < max_lon


def test_apply_spatial_filter():
    v1 = Venue(id="1", latitude=59.9139, longitude=10.7522)  # 0m away
    v2 = Venue(id="2", latitude=59.9150, longitude=10.7530)  # ~130m away
    v3 = Venue(id="3", latitude=60.1000, longitude=10.9000)  # > 20km away

    venues = [v3, v1, v2]
    filtered = apply_spatial_filter(venues, 59.9139, 10.7522, radius_meters=1000.0)

    # v3 should be excluded, v1 and v2 included and sorted by distance
    assert len(filtered) == 2
    assert filtered[0][0].id == "1"
    assert filtered[1][0].id == "2"
    assert filtered[0][1] <= filtered[1][1]
