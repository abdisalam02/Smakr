from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SpeedTestCreate(BaseModel):
    download_mbps: float = Field(..., ge=0.0, le=2000.0, description="Download speed in Megabits per second")
    ping_ms: float = Field(..., ge=0.0, le=5000.0, description="Latency in milliseconds")
    network_ssid: Optional[str] = Field(None, max_length=100, description="WiFi network name/SSID")


class SpeedTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    venue_id: str
    download_mbps: float
    ping_ms: float
    network_ssid: Optional[str] = None
    created_at: datetime
