# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-09

## Now
- Task: Fixed pin icon precedence (curated badge > legacy vibe_signals); Farine/Silin/Mandi taxonomy mapped; avatar audit ready.
- Status: Implemented & verified with clean tsc. Ready for git commit/push and avatar boot screen migration.

## Next (max 3)
1. Complete dynamic avatar boot screen migration per AVATAR_BOOT_AUDIT.md.
2. Perfect no-shadow studio renders when image quota resets.
3. Review remaining dependency advisories with `npm run security:audit`.

## Decisions (don't reopen)
- Product is Smakr; the app lives in `frontend/`.
- `backend/` is retired FastAPI: never scan, edit, or revive it.
- Weekly drop is stored in `weekly_picks`, not `weekly_drop`.
- Docs: `GEMINI.md` router, `AGENT_BRIEF.md` contract, `DESIGN_SYSTEM.md` visual source.

## Open / TODO
- TODO-VERIFY: confirm partner claim copy before launch.

## Recent (max 5, one line each)
- 2026-11-09 — Fixed map pin precedence, v4 pin cache key, Farine cinnamon roll & Mandi taxonomy; tsc clean
- 2026-11-09 — Generated AVATAR_BOOT_AUDIT.md comparing Approach A (Sprite Atlas) vs B (DOM SVGs)
- 2026-11-09 — Fixed spots feed scroll lag/disappearing cards; restored expanding bottom nav; tsc clean
- 2026-11-09 — Fixed feed density toggle stacking context (z-0 orange pill under active icon); tsc clean
- 2026-11-09 — +20% spot card/image size, tighter 10px card gap, 1x/2x grid toggle & smooth bottom nav pill; tsc clean
