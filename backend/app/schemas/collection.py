from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CollectionCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    emoji: Optional[str] = "📍"
    tag: Optional[str] = None
    venue_ids: List[str] = Field(default_factory=list)
    is_curated: bool = False


class CollectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    emoji: str
    tag: Optional[str] = None
    venue_ids: List[str] = []
    is_curated: bool = False
    created_at: datetime
