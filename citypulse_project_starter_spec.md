# CityPulse — Project Architecture & Implementation Plan

**Project Name:** CityPulse (Live Café, Study Spot & Co-Working Vibe Radar)  
**Target Market/Scope:** Urban centers (e.g., Oslo, Bergen, Stockholm, remote-friendly cities)  
**Core Problem Solved:** Remote workers, developers, freelancers, and students waste time traveling to cafés, libraries, and co-working spaces only to find zero available seating, noisy environments, lack of power outlets, or unreliable WiFi.  
**Primary Career Skill Gains:** **Python 3.12 (FastAPI + AsyncIO + WebSockets)**, **PostgreSQL 16 + PostGIS (Spatial Indexing & GPS Queries)**, **Redis (In-Memory Live Counts & Pub/Sub)**, **Interactive Map UI (Mapbox GL / MapLibre)**, **Automated Testing (Pytest + Playwright)**, and **Docker CI/CD**.

---

## 1. Core Feature Specification

```mermaid
graph TD
    User["User (Browser / Mobile)"] --> GPS["Browser Geolocation (Oslo / User Coordinates)"]
    GPS --> MapView["Interactive Map (Mapbox GL / MapLibre)"]
    
    MapView --> Spot1["📍 Green Pin: Quiet & Free Seats (e.g. Deichman Bjørvika)"]
    MapView --> Spot2["📍 Yellow Pin: Moderate Buzz (e.g. Fuglen Gamlebyen)"]
    MapView --> Spot3["📍 Red Pin: Packed / No Outlets (e.g. Kaffebrenneriet)"]
    
    User --> CheckIn["⚡ 30-Second Quick Check-in"]
    CheckIn --> VibeScore["Vibe Calculation Engine (Decays after 2 hours)"]
    VibeScore --> WebSockets["WebSocket Broadcast & Redis Pub/Sub"]
    WebSockets --> AllUsers["Live Map Update on All Connected Clients"]
```

### Key Features:
1. **Interactive Geospatial Map & Radar:**
   * Custom dark/light vector map showing coffee shops, public libraries, and hotel lobbies.
   * Color-coded pulsing pins indicating real-time vibe:
     - 🟢 **Optimal:** High seat availability, quiet/focused noise level, power outlets available.
     - 🟡 **Moderate:** Half full, ambient background music, some outlets available.
     - 🔴 **Packed:** No seats available, loud environment, no outlets.
2. **Filters That Actually Matter for Work & Study:**
   * *Outlets Available*, *Silent/Quiet Zone*, *WiFi > 50 Mbps*, *Open Late*, *Outdoor Seating*, *Dog Friendly*.
3. **The 30-Second Live Check-In (Community Sourced):**
   * One-click voting modal:
     - **Seats:** `[Empty (1)]` | `[Moderate (2)]` | `[Packed (3)]`
     - **Noise:** `[Whisper/Silent]` | `[Gentle Buzz]` | `[Loud/Music]`
     - **Outlets:** `[Plenty]` | `[Few]` | `[None]`
   * **Smart Ephemeral Decay:** Check-ins have an exponential decay algorithm (weight fades over 2 hours so data is always fresh).
4. **Built-In 5-Second WiFi Speed Tester:**
   * In-browser latency and download speed measurement to verify actual venue WiFi performance.
5. **Curated Collections & Bookmarks:**
   * Users can save spots into custom lists (*"Best Coffee in Grünerløkka"*, *"Weekend Study Sanctuaries"*).

---

## 2. Technology Stack Breakdown

```mermaid
graph LR
    Next["Frontend: Next.js 15 (React 19 + TypeScript + Mapbox GL + Tailwind + Zustand)"]
    FastAPI["Backend: Python 3.12 (FastAPI + AsyncIO + WebSockets + Pydantic)"]
    PostGIS["Database: PostgreSQL 16 + PostGIS (Spatial Queries ST_DWithin)"]
    Redis["Cache & Real-Time: Redis (Pub/Sub & 2-Hour Check-in TTLs)"]
    DevOps["DevOps: Docker Compose + Pytest + Playwright + GitHub Actions"]

    Next <-->|"REST API + WebSockets"| FastAPI
    FastAPI <--> PostGIS
    FastAPI <--> Redis
    FastAPI --- DevOps
```

---

## 3. Database Schema (PostgreSQL + PostGIS)

```mermaid
erDiagram
    VENUES ||--o{ LIVE_CHECKINS : receives
    VENUES ||--o{ WIFI_SPEED_TESTS : logs
    VENUES ||--o{ REVIEWS : has
    USERS ||--o{ LIVE_CHECKINS : submits
    USERS ||--o{ SAVED_COLLECTIONS : owns

    VENUES {
        uuid id PK
        string name
        string address
        string city
        geography location_geom "PostGIS POINT(lat, lon)"
        string place_type "cafe | library | coworking"
        string google_place_id
        string opening_hours_json
        string cover_image_url
        boolean has_wifi
        boolean has_outlets
        timestamp created_at
    }

    LIVE_CHECKINS {
        uuid id PK
        uuid venue_id FK
        uuid user_id FK
        int seat_level "1: Empty, 2: Moderate, 3: Packed"
        int noise_level "1: Silent, 2: Ambient, 3: Loud"
        boolean outlets_available
        timestamp created_at "Indexed for time-decay weighting"
    }

    WIFI_SPEED_TESTS {
        uuid id PK
        uuid venue_id FK
        decimal download_mbps
        decimal ping_ms
        string network_ssid
        timestamp created_at
    }

    SAVED_COLLECTIONS {
        uuid id PK
        uuid user_id FK
        string title
        string description
        json venue_ids
        timestamp created_at
    }
```
