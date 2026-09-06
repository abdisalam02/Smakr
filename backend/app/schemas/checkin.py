from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CheckinCreate(BaseModel):
    seat_level: int = Field(..., ge=1, le=3, description="1=Empty, 2=Moderate, 3=Packed")
    noise_level: int = Field(..., ge=1, le=3, description="1=Silent, 2=Ambient, 3=Loud")
    outlets_available: bool = Field(..., description="Whether power outlets are available")
    comment: Optional[str] = Field(None, max_length=500)
    user_id: Optional[str] = Field(None, description="Optional user ID or anonymous session ID")


class CheckinResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    venue_id: str
    seat_level: int
    noise_level: int
    outlets_available: bool
    comment: Optional[str] = None
    created_at: datetime
