import math
from datetime import datetime, timezone
from typing import List, Optional
from app.core.config import settings
from app.schemas.venue import VibeMetrics


def calculate_exponential_weight(
    created_at: datetime,
    now: Optional[datetime] = None,
    half_life_minutes: float = settings.HALF_LIFE_MINUTES,
    max_window_hours: float = settings.DECAY_WINDOW_HOURS,
) -> float:
    """
    Calculates the exponential decay weight for a checkin.
    Formula: W(t) = exp(-lambda * delta_t)
    where lambda = ln(2) / half_life_minutes
    """
    if now is None:
        now = datetime.utcnow()

    # Normalize timezones
    if created_at.tzinfo is not None:
        created_at = created_at.astimezone(timezone.utc).replace(tzinfo=None)
    if now.tzinfo is not None:
        now = now.astimezone(timezone.utc).replace(tzinfo=None)

    delta_seconds = max(0.0, (now - created_at).total_seconds())
    delta_minutes = delta_seconds / 60.0

    # If beyond max window (default 2 hours), weight is 0
    if delta_minutes > (max_window_hours * 60.0):
        return 0.0

    decay_constant = math.log(2.0) / half_life_minutes
    weight = math.exp(-decay_constant * delta_minutes)
    return max(0.0, min(1.0, weight))


def compute_venue_vibe(
    venue,
    checkins: List[any],
    speed_tests: Optional[List[any]] = None,
    now: Optional[datetime] = None,
) -> VibeMetrics:
    """
    Aggregates active check-ins using the exponential decay engine.
    Produces real-time status: 'optimal' (green), 'moderate' (yellow), 'packed' (red).
    """
    if now is None:
        now = datetime.utcnow()

    total_weight = 0.0
    weighted_seats = 0.0
    weighted_noise = 0.0
    weighted_outlets = 0.0
    active_count = 0
    latest_checkin_time = None

    for c in checkins:
        w = calculate_exponential_weight(c.created_at, now=now)
        if w > 0.001:
            total_weight += w
            weighted_seats += w * c.seat_level
            weighted_noise += w * c.noise_level
            weighted_outlets += w * (1.0 if c.outlets_available else 0.0)
            active_count += 1
            if latest_checkin_time is None or c.created_at > latest_checkin_time:
                latest_checkin_time = c.created_at

    # If we have active recent check-ins
    if total_weight > 0.0:
        seat_score = round(weighted_seats / total_weight, 2)
        noise_score = round(weighted_noise / total_weight, 2)
        outlets_ratio = weighted_outlets / total_weight
        outlets_pct = round(outlets_ratio * 100.0, 1)
        is_live = True
        # Decay factor is normalized average weight of active check-ins
        decay_factor = round(min(1.0, total_weight / max(1, active_count)), 2)
    else:
        # Fall back to venue baseline
        seat_score = round(float(getattr(venue, "baseline_seats", 1.8)), 2)
        noise_score = round(float(getattr(venue, "baseline_noise", 1.8)), 2)
        baseline_outlets = getattr(venue, "baseline_outlets", True)
        outlets_pct = 90.0 if baseline_outlets else 10.0
        is_live = False
        decay_factor = 1.0

    # Determine labels
    # Seats
    if seat_score <= 1.4:
        seat_label = "Empty"
    elif seat_score <= 2.2:
        seat_label = "Moderate"
    else:
        seat_label = "Packed"

    # Noise
    if noise_score <= 1.4:
        noise_label = "Silent / Whisper"
    elif noise_score <= 2.2:
        noise_label = "Gentle Buzz"
    else:
        noise_label = "Loud / Music"

    # Outlets
    if outlets_pct >= 65.0:
        outlets_label = "Plenty"
    elif outlets_pct >= 30.0:
        outlets_label = "Few"
    else:
        outlets_label = "None"

    # Composite overall score: weighted combination
    # Lower is better (1.0 = best empty/quiet, 3.0 = crowded/loud/no-power)
    outlet_penalty = (100.0 - outlets_pct) / 100.0 * 2.0 + 1.0  # 1.0 to 3.0
    overall_score = round((seat_score * 0.45) + (noise_score * 0.35) + (outlet_penalty * 0.20), 2)

    # Determine overall status (traffic light green/yellow/red)
    if seat_score <= 1.6 and noise_score <= 1.7 and outlets_pct >= 50.0:
        overall_status = "optimal"  # 🟢
    elif seat_score > 2.4 or noise_score > 2.4 or outlets_pct < 25.0:
        overall_status = "packed"   # 🔴
    else:
        overall_status = "moderate" # 🟡

    # Calculate average speed test if available
    avg_speed = None
    avg_ping = None
    if speed_tests and len(speed_tests) > 0:
        valid_speeds = [s.download_mbps for s in speed_tests if s.download_mbps is not None]
        valid_pings = [s.ping_ms for s in speed_tests if s.ping_ms is not None]
        if valid_speeds:
            avg_speed = round(sum(valid_speeds) / len(valid_speeds), 1)
        if valid_pings:
            avg_ping = round(sum(valid_pings) / len(valid_pings), 1)

    return VibeMetrics(
        seat_score=seat_score,
        seat_label=seat_label,
        noise_score=noise_score,
        noise_label=noise_label,
        outlets_percentage=outlets_pct,
        outlets_label=outlets_label,
        overall_status=overall_status,
        overall_score=overall_score,
        active_checkins_count=active_count,
        last_checkin_at=latest_checkin_time,
        is_live=is_live,
        decay_factor=decay_factor,
        avg_download_mbps=avg_speed,
        avg_ping_ms=avg_ping,
    )
