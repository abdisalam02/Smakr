import math
from typing import Tuple, List, Dict, Any

EARTH_RADIUS_METERS = 6371000.0  # WGS-84 mean radius


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes Great Circle distance between two GPS coordinates using the Haversine formula.
    Returns distance in meters.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return EARTH_RADIUS_METERS * c


def get_bounding_box(lat: float, lon: float, radius_meters: float) -> Tuple[float, float, float, float]:
    """
    Computes a bounding box (min_lat, max_lat, min_lon, max_lon)
    for pre-filtering spatial database queries with index scans.
    """
    lat_delta = (radius_meters / EARTH_RADIUS_METERS) * (180.0 / math.pi)
    lon_delta = (radius_meters / (EARTH_RADIUS_METERS * math.cos(math.radians(lat)))) * (180.0 / math.pi)

    min_lat = lat - lat_delta
    max_lat = lat + lat_delta
    min_lon = lon - lon_delta
    max_lon = lon + lon_delta

    return min_lat, max_lat, min_lon, max_lon


def apply_spatial_filter(
    venues: List[Any],
    center_lat: float,
    center_lon: float,
    radius_meters: float,
) -> List[Tuple[Any, float]]:
    """
    Filters venues within radius_meters from center coordinate and returns (venue, distance_meters)
    sorted in ascending order of proximity.
    """
    results = []
    for v in venues:
        dist = haversine_distance(center_lat, center_lon, v.latitude, v.longitude)
        if dist <= radius_meters:
            results.append((v, round(dist, 1)))

    # Sort by distance ascending
    results.sort(key=lambda item: item[1])
    return results
