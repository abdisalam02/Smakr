from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.checkin import CheckinResponse
from app.schemas.speedtest import SpeedTestResponse


class VibeMetrics(BaseModel):
    seat_score: float = Field(..., description="Weighted seat score: 1.0 (Empty) to 3.0 (Packed)")
    seat_label: str = Field(..., description="'Empty', 'Moderate', or 'Packed'")
    
    noise_score: float = Field(..., description="Weighted noise score: 1.0 (Silent) to 3.0 (Loud)")
    noise_label: str = Field(..., description="'Silent / Whisper', 'Gentle Buzz', or 'Loud / Music'")
    
    outlets_percentage: float = Field(..., description="Percentage of recent check-ins reporting outlets (0-100%)")
    outlets_label: str = Field(..., description="'Plenty', 'Few', or 'None'")
    
    overall_status: str = Field(..., description="'optimal' (green), 'moderate' (yellow), or 'packed' (red)")
    overall_score: float = Field(..., description="Normalized composite vibe index (1.0 - 3.0)")
    
    active_checkins_count: int = Field(0, description="Number of check-ins within active decay window (last 2h)")
    last_checkin_at: Optional[datetime] = None
    is_live: bool = Field(False, description="True if based on fresh check-ins, False if baseline estimate")
    decay_factor: float = Field(1.0, description="Freshness factor from 0.0 to 1.0")
    
    avg_download_mbps: Optional[float] = None
    avg_ping_ms: Optional[float] = None


class VenueBase(BaseModel):
    name: str = Field(..., max_length=255)
    address: str = Field(..., max_length=255)
    city: str = Field("Oslo", max_length=100)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    place_type: str = Field("cafe", description="cafe, library, coworking, hotel_lobby")
    
    google_place_id: Optional[str] = None
    opening_hours_json: Optional[Dict[str, Any]] = None
    cover_image_url: Optional[str] = None
    description: Optional[str] = None
    
    has_wifi: bool = True
    has_outlets: bool = True
    silent_zone: bool = False
    outdoor_seating: bool = False
    dog_friendly: bool = False
    open_late: bool = False
    
    baseline_seats: float = 1.8
    baseline_noise: float = 1.8
    baseline_outlets: bool = True


class VenueCreate(VenueBase):
    pass


class VenueResponse(VenueBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: Optional[datetime] = None
    vibe: VibeMetrics
    distance_meters: Optional[float] = None


class VenueDetailResponse(VenueResponse):
    recent_checkins: List[CheckinResponse] = []
    recent_speed_tests: List[SpeedTestResponse] = []


class VenueNearbyParams(BaseModel):
    lat: float = Field(59.9139, description="Center latitude (default: Oslo center)")
    lon: float = Field(10.7522, description="Center longitude (default: Oslo center)")
    radius_meters: float = Field(3000.0, ge=100.0, le=50000.0, description="Search radius in meters")
    place_type: Optional[str] = Field(None, description="Filter by cafe, library, coworking, etc.")
    has_wifi: Optional[bool] = None
    has_outlets: Optional[bool] = None
    silent_zone: Optional[bool] = None
    open_late: Optional[bool] = None
    outdoor_seating: Optional[bool] = None
    dog_friendly: Optional[bool] = None
    min_download_mbps: Optional[float] = None
    vibe_status: Optional[str] = Field(None, description="'optimal', 'moderate', or 'packed'")
