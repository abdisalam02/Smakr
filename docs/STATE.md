# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-10-29

## Now
- Task: Email mascot dark-mode inversion fix, full-bleed email layout, and feed/sheet performance pass.
- Status: `tsc --noEmit` and `npm run test:security` clean; blur placeholders and memoized rigs active.

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
- 2026-10-29 — Moved the ad reel to ad-studio; removed `/ad-reel`, tsc clean
- 2026-10-29 — Applied workspace harness; archived prior history
- Security — automated terminal suite for headers, secret isolation, RLS, and API auth
- Security — standard HTTP security headers in `frontend/next.config.ts`
- Security — remediated 3 high/critical CVEs; added `npm run security:audit`
