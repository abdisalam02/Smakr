# Seeding Lab Audit & Pop-Up Radar Evolution

> **Date**: 2026-11-09  
> **Topic**: Seeding Lab Workflow Audit, AI-Powered Natural Language Card Updater, and Pop-Up Feed Card Redesign Proposal  
> **Status**: Ready for Review & Implementation

---

## 1. Immediate Data Correction: Mint on Wheels
The previous placeholder location in Hasle was corrected. Mint on Wheels is an itinerant mobile matcha pop-up cart whose next confirmed drop is in Oslobukta:

- **Host Venue**: Mike's Corner, Oslobukta
- **Address**: `Operagata 77d, Oslo`
- **Neighborhood**: `bjorvika`
- **Coordinates**: `59.9075, 10.7582`
- **Drop Date & Time**: **Thursday, Nov 14th @ 12:00 PM** (until sold out)
- **Status**: `next_confirmed` (Upcoming Drop)
- **Dates Label**: `Nov 14 · 12:00 Drop`
- **Supabase Production**: Live and updated via service role client.
- **Staged Candidates**: Synchronized in `frontend/curation/staged_candidates.json`.

---

## 2. Visual Audit: Spot Cards vs. Dish Cards in the Feed

The user flagged a distinct aesthetic gap between the **Dish Feed Cards** (`FoodPostCard.tsx`) and the **Spot / Restaurant Cards** (`FoodSpotCard.tsx`):

![Card Comparison: Spots Card vs Dish Feed Cards](C:/Users/abdis/.gemini/antigravity/brain/aa12b53b-04fa-4259-8560-24d7f40dbfbd/card_comparison_spots_vs_dishes.png)

### Why Dish Cards Succeed
1. **Visual Dominance**: 4:3 high-resolution aspect ratio with edge-to-edge photography and dark bottom gradient scrim.
2. **Display Typography**: Hand-drawn `Comico` headlines (`DOUBLE BISCOFF`) that leap off the canvas.
3. **Food-First Focus**: Macro food texture, authentic taste tags (`#ceremonial-grade`), and verified badge pills.
4. **Appetite Appeal**: Evokes the physical sensory experience of craving and discovery.

### Where Spot Cards Fall Short for Pop-Ups
1. **Utility Directory Feel**: Built as a compact horizontal row with a 128×128 square thumbnail and 4 stacked lines of text. Works for brick-and-mortar bakeries, but kills the excitement of an underground drop.
2. **Missing Drop Scarcity**: Pop-ups live on limited portions, specific dates, and temporary residencies. A standard restaurant row fails to communicate urgency.
3. **No Instagram Anchor**: Pop-up culture in Oslo runs entirely on Instagram stories and queue updates. The current card hides the Instagram handle inside modals.

---

## 3. Proposed Redesign: "The Pop-Up Drop Poster" Card

Instead of rendering pop-ups in the same horizontal utility row as permanent bakeries, pop-ups in the feed should render as an **Event-Poster Card**:

```
┌────────────────────────────────────────────────────────┐
│ [🔥 LIVE DROP / ⏳ NOV 14 · 12:00]      [@mintonwheels] │
├────────────────────────────────────────────────────────┤
│                                                        │
│                  FULL 4:3 PHOTO STAGE                  │
│       (Ceremonial Matcha Pour / Mobile Cart Scene)     │
│                                                        │
│  📍 Hosted at Mike's Corner · Bjørvika                 │
│  ────────────────────────────────────────────────────  │
│  MINT ON WHEELS                                        │
│  ✦ Double Biscoff · Limited Kyoto Batch (80 cups)      │
├────────────────────────────────────────────────────────┤
│ [ 📷 Drop Alerts (IG) ]        [ Directions to Host ↗ ] │
└────────────────────────────────────────────────────────┘
```

### Key Design Pillars
1. **4:3 Vertical Poster Aspect Ratio**: Matches `FoodPostCard` height so the mixed feed maintains visual balance without awkward height breaks.
2. **Live Scarcity Header**: Sticky pill with drop date, countdown, or portion cap (`Nov 14 · 12:00` or `80 portions only`).
3. **Residency Anchor Watermark**: Clearly shows the host venue badge (e.g. `Hosted at Mike's Corner · Bjørvika`).
4. **Instant Action Row**: A direct gradient Instagram CTA button (`Follow for Drop Alerts`) without needing to open the full modal.

---

## 4. Seeding Lab Audit (`/admin/seeding-lab`)

### Current Architecture
- **Staging Store**: `frontend/curation/staged_candidates.json` (disk JSON cache).
- **Mode Switcher**: Sliding segmented toggle separating Regular Spots (20) from Pop-Up Radar (10).
- **Direct Asset Pipeline**: `/api/admin/upload-seed-image` handles file drag-and-drop, clipboard paste (`Ctrl+V`), and Sharp webp optimization.
- **Granular Actions**: Individual spot commit (`Commit Spot 🚀`) and solo dish selection (`⭐ Use Only This Dish`).

### Identified Gaps & Friction Points
| Friction Point | Current Workaround | Proposed Solution |
|---|---|---|
| **Drop schedule changes** | Manual JSON edit or custom DB script | **AI Natural Language Quick Shift** |
| **Address geocoding for host venues** | Manual lat/lng lookup in Google Maps | **Auto-resolve from Oslo host venue registry** |
| **Post-seed updates** | Once marked `seeded`, spot is locked | **"Update & Sync" button for live seeded spots** |
| **Batch schedule parsing** | Freeform `notes` string parsing with regex | **Structured `popup_meta` JSON editor in modal** |

---

## 5. Proposed Feature: "AI Quick Shift" (NLP Card Updater)

### Concept
A one-click conversational updater for curators. When a pop-up announces a new date, menu drop, or host change on Instagram, the curator pastes the raw text, and Gemini parses it into structured schema with an interactive diff preview before committing.

### User Flow
1. **Trigger**: Curator clicks **"✨ AI Shift"** on any candidate or seeded card.
2. **Prompt Input**: Curator pastes raw announcement text:
   > *"Next pop-up confirmed for Thursday Nov 14th at Mike's Corner in Oslobukta starting at 12:00. Bringing the Kyoto Double Biscoff and cold brew matcha. 80 cups only."*
3. **Structured Extraction** (via Gemini 1.5 Flash route `/api/admin/ai-shift-spot`):
   ```json
   {
     "neighborhood": "bjorvika",
     "address": "Mike's Corner, Operagata 77d, Oslo",
     "latitude": 59.9075,
     "longitude": 10.7582,
     "popup_meta": {
       "residency_status": "next_confirmed",
       "dates_label": "Nov 14 · 12:00 Drop",
       "daily_hours": "Thu Nov 14 · 12:00 until sold out",
       "next_drop_date": "2026-11-14T12:00:00",
       "portion_cap": "80 cups only",
       "host_venue_name": "Mike's Corner, Oslobukta",
       "host_address": "Operagata 77d, 0194 Oslo"
     },
     "signature_dish": "Double Biscoff",
     "current_opening_hours_text": "Thu Nov 14 · 12:00 until sold out"
   }
   ```
4. **Live Side-by-Side Diff Preview**:
   - Shows current card vs updated card in real time.
   - Curator can manually adjust any extracted field if needed.
5. **Commit**:
   - Curator clicks **"Apply & Push to Production 🚀"**.
   - Updates Supabase `venues` row and syncs `staged_candidates.json` simultaneously.

---

## 6. Implementation Roadmap

1. **Step 1: AI Shift API Route** (`/api/admin/ai-shift-spot`): Lightweight Gemini prompt that accepts raw text + current spot schema, returning validated partial updates with Oslo neighborhood/host coordinates.
2. **Step 2: AI Shift Modal in Seeding Lab**: Input box with prompt chips, live diff inspector, and manual override fields.
3. **Step 3: Pop-Up Poster Card Component** (`PopUpDropCard.tsx`): 4:3 high-impact card for the feed with host residency watermark and gradient Instagram CTA.
