import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Float, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Venue(Base):
    __tablename__ = "venues"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, default="Oslo", index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    place_type = Column(String(50), nullable=False, default="cafe", index=True)  # cafe, library, coworking, hotel_lobby
    
    google_place_id = Column(String(255), nullable=True)
    opening_hours_json = Column(JSON, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    
    # Feature flags / amenities
    has_wifi = Column(Boolean, default=True, index=True)
    has_outlets = Column(Boolean, default=True, index=True)
    silent_zone = Column(Boolean, default=False, index=True)
    outdoor_seating = Column(Boolean, default=False)
    dog_friendly = Column(Boolean, default=False)
    open_late = Column(Boolean, default=False, index=True)
    
    # Baseline defaults when no live checkins are present
    baseline_seats = Column(Float, default=1.8)  # 1.0 (Empty) to 3.0 (Packed)
    baseline_noise = Column(Float, default=1.8)  # 1.0 (Silent) to 3.0 (Loud)
    baseline_outlets = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    checkins = relationship("LiveCheckin", back_populates="venue", cascade="all, delete-orphan", order_by="desc(LiveCheckin.created_at)")
    speed_tests = relationship("WifiSpeedTest", back_populates="venue", cascade="all, delete-orphan", order_by="desc(WifiSpeedTest.created_at)")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "city": self.city,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "place_type": self.place_type,
            "google_place_id": self.google_place_id,
            "opening_hours_json": self.opening_hours_json,
            "cover_image_url": self.cover_image_url,
            "description": self.description,
            "has_wifi": self.has_wifi,
            "has_outlets": self.has_outlets,
            "silent_zone": self.silent_zone,
            "outdoor_seating": self.outdoor_seating,
            "dog_friendly": self.dog_friendly,
            "open_late": self.open_late,
            "baseline_seats": self.baseline_seats,
            "baseline_noise": self.baseline_noise,
            "baseline_outlets": self.baseline_outlets,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
