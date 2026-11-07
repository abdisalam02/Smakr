# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-02

## Now
- Task: Zero-cost Google Places Ingest-Once -> Supabase Storage CDN architecture.
- Status: Migrated 100% of DB photos (0 proxy URLs remain), sharp WebP pipeline active, tsc clean.

## Next (max 3)
1. Re-run `npm run test:security` from `frontend/` after any environment change.
2. Review remaining dependency advisories with `npm run security:audit`.
3. Verify partner claim and kitchen token flows against current migrations.

## Decisions (don't reopen)
- Product is Smakr; the app lives in `frontend/`.
- `backend/` is retired FastAPI: never scan, edit, or revive it.
- Weekly drop is stored in `weekly_picks`, not `weekly_drop`.
- Ad reels live in `htdocs/ad-studio`; shared mascot/map components stay here.
- Docs: `GEMINI.md` router, `AGENT_BRIEF.md` contract, `DESIGN_SYSTEM.md` visual source.

## Open / TODO
- TODO-VERIFY: confirm partner claim copy before launch.
- No other open items recorded in this handoff.

## Recent (max 5, one line each)
- 2026-11-07 — Padded map icons 16px, radial SVG die-cut filter, 60fps feed-pull accordion, bust avatars, instant nav switch; tsc clean
- 2026-11-07 — Isolated pizza & pasta pins, dual-layer selected rim, frosted Map button, yoink gesture, 120fps nav switch; tsc clean
- 2026-11-07 — Refined delicate orange pin hue, normalized pizza/pasta scale, high-contrast sweater busts, 0ms tab switch; tsc clean
- 2026-11-07 — Fixed viewboxMask headless avatar bug, normalized 38px SVG map pins, 120fps imperative filter drag, atomic filter dispatch, radar Map pill; tsc clean
- 2026-11-07 — Fixed bottom nav phantom clicks & solid cream bg, solid cream Map pill, Plus Jakarta Sans card titles, top sheet drag, 35% smaller map pins; tsc clean
