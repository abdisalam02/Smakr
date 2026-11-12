# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-12

## Now
- Task: Smooth filter drawer close (`duration-[260ms]`), smooth card-close alignment, and full feed-to-map filter sync.
- Status: Complete — `tsc` clean; dev server running at `http://10.0.0.1:3001` for phone testing.

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
- 2026-11-12 — Added spatial nearest-neighbor dock ordering, eased map panning harmony, calmer card pop, and Details bottom-spring restore; tsc clean
- 2026-11-12 — Built single-row Cover-Flow carousel morph (grow/shrink in-place + photo parallax, zero duplicate row); tsc clean
- 2026-11-12 — Rebuilt map spotlight card swipe with live 1:1 pointer drag, velocity commit, and 3-slot deck; tsc clean
- 2026-11-12 — Added U WAN SUM to staged_candidates popups for AI Shift drop testing; tsc clean
- 2026-11-11 — Implemented audit P0/P1: no SVG pin filters, zero weekly-marker DOM rebuilds, transform-only 365px card; tsc + build clean
