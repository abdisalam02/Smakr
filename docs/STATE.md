# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-09

## Now
- Task: 8 custom WebP icons cutout & live on map pins/taxonomy; guide updated at docs/FOOD_ICON_FACTORY_GUIDE.md.
- Status: Implemented & verified. Faint contact shadows will be perfected on quota reset.

## Next (max 3)
1. Perfect no-shadow studio renders when image quota resets (~4h).
2. Re-run `npm run test:security` from `frontend/` after any environment change.
3. Review remaining dependency advisories with `npm run security:audit`.

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
- 2026-11-09 — Fixed feed density toggle stacking context (z-0 orange pill under active icon); tsc clean
- 2026-11-09 — +20% spot card/image size, tighter 10px card gap, 1x/2x grid toggle & smooth bottom nav pill; tsc clean
- 2026-11-09 — Redesigned FoodSpotCard: Warm Oat, frosted rating glass, flag + category tag, NOK price; tsc clean
- 2026-11-09 — Softened docked sticky header scrim to backdrop-blur-md with 65% opacity; tsc clean
- 2026-11-09 — Seeded 20 spots & 21 dishes from spots_dishes_enrichment.json to Supabase; tsc clean
