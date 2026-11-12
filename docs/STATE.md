# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-12

## Now
- Task: Add U WAN SUM popup candidate to Seeding Lab for AI Shift testing.
- Status: Staged candidate configured and verified; `tsc` clean.

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
- 2026-11-12 — Added U WAN SUM to staged_candidates popups for AI Shift drop testing; tsc clean
- 2026-11-11 — Implemented audit P0/P1: no SVG pin filters, zero weekly-marker DOM rebuilds, transform-only 365px card; tsc + build clean
- 2026-11-11 — Full-page feed, flush glass FEED pull tab, pin zoom choreography + dock spotlight card, renamed STORY; tsc clean
- 2026-11-10 — Decluttered Map Mode: collapsible glass filters, glass > FEED pill, suppressed map popup; tsc clean
- 2026-11-10 — Built in-feed split Smakr Pick, editorial swimlanes, full-screen map mode & dock; tsc clean
