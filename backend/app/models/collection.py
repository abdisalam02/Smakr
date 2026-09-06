import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON, Boolean
from app.core.database import Base


class SavedCollection(Base):
    __tablename__ = "saved_collections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(100), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    emoji = Column(String(10), default="📍")
    tag = Column(String(50), nullable=True)
    venue_ids = Column(JSON, default=list)  # List of venue IDs
    is_curated = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "emoji": self.emoji,
            "tag": self.tag,
            "venue_ids": self.venue_ids or [],
            "is_curated": self.is_curated,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
