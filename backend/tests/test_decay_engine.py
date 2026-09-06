import pytest
import math
from datetime import datetime, timedelta
from app.services.decay_engine import calculate_exponential_weight, compute_venue_vibe
from app.models import Venue, LiveCheckin, WifiSpeedTest


def test_exponential_decay_weight_math():
    now = datetime(2026, 9, 1, 12, 0, 0)

    # 1. Immediate check-in (delta = 0 min) -> Weight = 1.0
    t0 = now
    w0 = calculate_exponential_weight(t0, now=now, half_life_minutes=60.0)
    assert pytest.approx(w0, 0.001) == 1.0

    # 2. Check-in exactly 1 half-life (60 min) ago -> Weight = 0.5
    t60 = now - timedelta(minutes=60)
    w60 = calculate_exponential_weight(t60, now=now, half_life_minutes=60.0)
    assert pytest.approx(w60, 0.001) == 0.5

    # 3. Check-in 2 half-lives (120 min) ago -> Weight = 0.25
    t120 = now - timedelta(minutes=120)
    w120 = calculate_exponential_weight(t120, now=now, half_life_minutes=60.0, max_window_hours=2.0)
    assert pytest.approx(w120, 0.001) == 0.25

    # 4. Check-in older than 2 hours (125 min) -> Weight = 0.0 (decay cutoff)
    t125 = now - timedelta(minutes=125)
    w125 = calculate_exponential_weight(t125, now=now, half_life_minutes=60.0, max_window_hours=2.0)
    assert w125 == 0.0


def test_venue_vibe_computation_optimal():
    now = datetime(2026, 9, 1, 12, 0, 0)
    venue = Venue(
        id="test-venue-1",
        name="Quiet Library",
        baseline_seats=2.0,
        baseline_noise=2.0,
        baseline_outlets=True,
    )

    # Recent check-in reporting Empty (1), Silent (1), Outlets (True)
    checkins = [
        LiveCheckin(
            venue_id=venue.id,
            seat_level=1,
            noise_level=1,
            outlets_available=True,
            created_at=now - timedelta(minutes=10),
        )
    ]

    vibe = compute_venue_vibe(venue, checkins, now=now)
    assert vibe.overall_status == "optimal"  # 🟢
    assert vibe.seat_score == 1.0
    assert vibe.noise_score == 1.0
    assert vibe.outlets_percentage == 100.0
    assert vibe.is_live is True
    assert vibe.active_checkins_count == 1


def test_venue_vibe_computation_packed():
    now = datetime(2026, 9, 1, 12, 0, 0)
    venue = Venue(
        id="test-venue-2",
        name="Packed Friday Café",
        baseline_seats=1.8,
        baseline_noise=1.8,
        baseline_outlets=True,
    )

    # Checkins reporting Packed (3), Loud (3), No outlets (False)
    checkins = [
        LiveCheckin(
            venue_id=venue.id,
            seat_level=3,
            noise_level=3,
            outlets_available=False,
            created_at=now - timedelta(minutes=5),
        ),
        LiveCheckin(
            venue_id=venue.id,
            seat_level=3,
            noise_level=3,
            outlets_available=False,
            created_at=now - timedelta(minutes=25),
        ),
    ]

    vibe = compute_venue_vibe(venue, checkins, now=now)
    assert vibe.overall_status == "packed"  # 🔴
    assert vibe.seat_score == 3.0
    assert vibe.noise_score == 3.0
    assert vibe.outlets_percentage == 0.0
    assert vibe.is_live is True
    assert vibe.active_checkins_count == 2


def test_venue_vibe_fallback_baseline():
    venue = Venue(
        id="test-venue-3",
        name="Empty Baseline Spot",
        baseline_seats=1.5,
        baseline_noise=1.4,
        baseline_outlets=True,
    )

    # Zero checkins -> should use baseline
    vibe = compute_venue_vibe(venue, [])
    assert vibe.is_live is False
    assert vibe.seat_score == 1.5
    assert vibe.noise_score == 1.4
    assert vibe.active_checkins_count == 0
