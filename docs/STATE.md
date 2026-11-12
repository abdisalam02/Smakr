# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-11

## Now
- Task: P0/P1 audit fixes — GPU pin/card motion, weekly marker no-rebuild, desktop dock containment, de-duped zero-hole feed, weekly 3-zone banner.
- Status: Complete on feat/editorial-feed-and-map-mode; `tsc` + production `next build` clean.

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
- 2026-11-11 — Implemented audit P0/P1: no SVG pin filters, zero weekly-marker DOM rebuilds, transform-only 365px card, contained desktop dock, de-duped even feed lanes; `tsc` + build clean
- 2026-11-11 — Full-page feed, flush glass FEED pull tab, pin zoom choreography + dock spotlight card, renamed STORY; tsc clean
- 2026-11-10 — Decluttered Map Mode: collapsible glass filters, glass > FEED pill, suppressed map popup, full-bleed parallax dock cards; tsc clean
- 2026-11-10 — Built in-feed split Smakr Pick, editorial swimlanes, full-screen map mode & dock, zoom pin scaling; tsc clean
- 2026-11-09 — Polished pop-up sheet background & map popup card, aligned @smak inline, removed fire reaction; tsc clean
