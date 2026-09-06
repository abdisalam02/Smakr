import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class LiveCheckin(Base):
    __tablename__ = "live_checkins"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    venue_id = Column(String(36), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(100), nullable=True, index=True)  # Can be anonymous session ID or registered user
    
    # 1: Empty (Plenty of seats), 2: Moderate (Few scattered seats), 3: Packed (Standing/No seats)
    seat_level = Column(Integer, nullable=False)
    
    # 1: Silent / Whisper, 2: Ambient / Gentle Buzz, 3: Loud / Music / Echoey
    noise_level = Column(Integer, nullable=False)
    
    # True: Outlets readily available, False: No outlets or blocked
    outlets_available = Column(Boolean, nullable=False, default=True)
    
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    venue = relationship("Venue", back_populates="checkins")

    def to_dict(self):
        return {
            "id": self.id,
            "venue_id": self.venue_id,
            "user_id": self.user_id,
            "seat_level": self.seat_level,
            "noise_level": self.noise_level,
            "outlets_available": self.outlets_available,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
