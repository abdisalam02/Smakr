# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-10

## Now
- Task: Major UI/UX upgrade: in-feed split Smakr Pick banner, editorial feed rhythm & swimlanes, full-screen map mode with neighborhood dock, and map pin zoom decluttering.
- Status: Complete on feat/editorial-feed-and-map-mode; tsc and test:security clean.

## Next (max 3)
1. Review editorial swimlanes and full-screen map mode visual feedback with team.
2. Curate and verify photos for remaining 9 staged pop-ups in /admin/seeding-lab.
3. Seed approved pop-up candidates to production radar.

## Decisions (don't reopen)
- Product is Smakr; the app lives in `frontend/`.
- `backend/` is retired FastAPI: never scan, edit, or revive it.
- Weekly drop is stored in `weekly_picks`, not `weekly_drop`.
- Docs: `GEMINI.md` router, `AGENT_BRIEF.md` contract, `DESIGN_SYSTEM.md` visual source.

## Open / TODO
- TODO-VERIFY: confirm partner claim copy before launch.

## Recent (max 5, one line each)
- 2026-11-10 — Built in-feed split Smakr Pick, editorial swimlanes, full-screen map mode & dock, zoom pin scaling; tsc clean
- 2026-11-09 — Polished pop-up sheet background & map popup card, aligned @smak inline, removed fire reaction; tsc clean
- 2026-11-09 — Fixed pop-up map pin die-cut rendering & cleaned pop-up card text/footer; tsc clean
- 2026-11-09 — Polished 2-col FoodPostCard grid, dynamic pop-up status/host/IG pills, and AI Quick Shift modal; tsc clean
- 2026-11-09 — Corrected Mint on Wheels to Mike's Corner Nov 14 drop; wrote Seeding Lab AI audit; tsc clean
