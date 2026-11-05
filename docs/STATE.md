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
- 2026-11-05 — Wired custom icons to Smakr map pins, spot cards & detail pane; restored K-Chicken garnished preset in studio; tsc clean
- 2026-11-05 — Fixed Coffee & Pizza background cutout: neutral shadow-aware flood fill + handle hole seeding; tsc clean
- 2026-11-05 — Overhauled 6 icons via Real-Photo De-ID + 44-color VTracer preset (color_precision=7, zero blur, vector-rasterized WebP <12 KB); tsc clean
- 2026-11-04 — Generated Pizza, Coffee, Bánh Mì & Ramen icons (<12 KB WebP, <60 KB SVG); wired studio, picker & radar; tsc clean
- 2026-11-04 — Fixed custom icon rendering: MapRadarView & drawer now render WebP icons instead of raw text; tsc clean
