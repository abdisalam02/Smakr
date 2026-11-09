# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-09

## Now
- Task: Restored bottom pop-out spring animation on restaurant card and removed borderbox from Concept & Story with larger font.
- Status: Complete in VenueBottomSheet and VenueDetailPane; tsc clean.

## Next (max 3)
1. Curate and verify photos for remaining 9 staged pop-ups in /admin/seeding-lab.
2. Seed approved pop-up candidates to production radar.
3. Monitor AI Quick Shift parser accuracy on upcoming IG drop announcements.

## Decisions (don't reopen)
- Product is Smakr; the app lives in `frontend/`.
- `backend/` is retired FastAPI: never scan, edit, or revive it.
- Weekly drop is stored in `weekly_picks`, not `weekly_drop`.
- Docs: `GEMINI.md` router, `AGENT_BRIEF.md` contract, `DESIGN_SYSTEM.md` visual source.

## Open / TODO
- TODO-VERIFY: confirm partner claim copy before launch.

## Recent (max 5, one line each)
- 2026-11-09 — Polished pop-up sheet background & map popup card, aligned @smak inline, removed fire reaction; tsc clean
- 2026-11-09 — Fixed pop-up map pin die-cut rendering & cleaned pop-up card text/footer; tsc clean
- 2026-11-09 — Polished 2-col FoodPostCard grid, dynamic pop-up status/host/IG pills, and AI Quick Shift modal; tsc clean
- 2026-11-09 — Corrected Mint on Wheels to Mike's Corner Nov 14 drop; wrote Seeding Lab AI audit; tsc clean
- 2026-11-09 — Aligned pop-up detail, map card & route to U WAN SUM standard with popup_meta; tsc clean
