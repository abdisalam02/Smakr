# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-14

## Now
- Task: Skiper 39 Open Peeps boot animation mounted on `/` (`HomeView.tsx`) with instant progressive atlas streaming, spring SMAKR logo + radar ping (no loading bar), and mobile Boot Lab pill.
- Status: Complete — `npx tsc --noEmit` clean.

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
- 2026-11-14 — Mounted Skiper 39 crowd boot on `/` (`HomeView.tsx`) with instant 21-cell starter streaming, spring logo + radar ping, and collapsible mobile Boot Lab controls; `npx tsc --noEmit` clean
- 2026-11-14 — Refined `SPRITE_OVERRIDES` across all 41 flagged Open Peeps sprites (pockets, glasses, cheeks, lapels, arms/fingers) in `bustCrowdPeep.ts`; `npx tsc --noEmit` clean
- 2026-11-13 — Rebuilt `/admin` & `/admin/seeding-lab` with preview-first click-to-edit cards, mobile sheets, admin API guards, WebP uploads, and live seeded DB sync; tsc + 19/19 security tests pass
- 2026-11-12 — Added spatial nearest-neighbor dock ordering, eased map panning harmony, calmer card pop, and Details bottom-spring restore; tsc clean
- 2026-11-12 — Built single-row Cover-Flow carousel morph (grow/shrink in-place + photo parallax, zero duplicate row); tsc clean
