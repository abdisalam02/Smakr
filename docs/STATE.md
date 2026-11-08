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
- 2026-11-07 — Fixed viewboxMask headless avatar bug, normalized 38px SVG map pins, 120fps imperative filter drag, atomic filter dispatch, radar Map pill; tsc clean
- 2026-11-07 — Fixed bottom nav phantom clicks & solid cream bg, solid cream Map pill, Plus Jakarta Sans card titles, top sheet drag, 35% smaller map pins; tsc clean
- 2026-11-07 — Calibrated 31px/35px map pins, fixed swipe-close double-close lag, restored elastic filter yoink stretch, Comico dish titles; tsc clean
- 2026-11-07 — Split GROUP_FILTER_WEBP & DISH_ICON_WEBP, clickable z-60 YOU collar stamp, 7-axis map filter sync, watercolor cuisine flags, zero-flash feed cards, 190ms single-pass venue sheet close; tsc clean
- 2026-11-08 — Fixed food pin taxonomy: Zam Zam -> cheesesteak, Håndbakt -> croissant, Lai Zai -> banh mi, Em Oi -> pho, Dirty Taco -> tacos; tsc clean
