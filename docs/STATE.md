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
- 2026-11-05 — Fixed category filter feed zero-state: wired taxonomy group & child matching so pill counts match displayed dishes; tsc clean
- 2026-11-05 — Made Pop-up mutual with categories, fixed white-on-white text, and smoothed All pill glide; tsc clean
- 2026-11-05 — Restored all 8 yesterday's custom dish icons to map pins & isolated filter icons in public/icons/filters; tsc clean
- 2026-11-05 — Reverted map pins to food icons/emojis, mapped street stall to restaurant, and fixed scroll-to-close anywhere in feed; tsc clean
- 2026-11-05 — Deployed 5 hand-drawn sketchbook icons (WebP + SVG) to app pills and map pucks; tsc clean
