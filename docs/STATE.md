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
- 2026-11-03 — Unified Google Maps directions URL across bottom sheet, detail pane, and radar; sanitized place_id queries
- 2026-11-03 — Pushed commit 0a6ed2e to origin/main: Google Places CDN ingest architecture, sharp WebP pipeline, clean build
- 2026-11-02 — V2 campaign deck: packaged all 5 slides in 3 aspect ratios (4:5, 9:16, 1:1) to ZIP, clean S3 & S4 distance, tsc clean
- 2026-11-02 — V2 deck fact-check: Daglig Brød Boller Gamlebyen, Miso Ramen Sentrum, Yum Cha Majorstuen, Håndbakt photo S3, S4 dish details, tsc clean
- 2026-11-02 — V2 deck: Daglig Brød hero pick S5, frosted glass CTA pill, removed 'menu' S4, tsc clean
