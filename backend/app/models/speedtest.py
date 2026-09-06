import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class WifiSpeedTest(Base):
    __tablename__ = "wifi_speed_tests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    venue_id = Column(String(36), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True)
    
    download_mbps = Column(Float, nullable=False)
    ping_ms = Column(Float, nullable=False)
    network_ssid = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    venue = relationship("Venue", back_populates="speed_tests")

    def to_dict(self):
        return {
            "id": self.id,
            "venue_id": self.venue_id,
            "download_mbps": self.download_mbps,
            "ping_ms": self.ping_ms,
            "network_ssid": self.network_ssid,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
