# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-15

## Now
- Task: Added ad-style top and bottom page-cream gradient hues in `MapRadarView.tsx` and matched translucent Warm-Oat capsules in `Header.tsx` & `FoodViewSlider.tsx` so map edges wash seamlessly into the logo, profile, and bottom nav.
- Status: Complete — `npx tsc --noEmit` exited `0`; ready for visual QA in browser.

## Next (max 3)
1. Preview and export the 2-slide Early Snowfall `@3x` PNG assets in `/ad-reel`.
2. User to confirm Hrimnir (`270 kr`) & Sapporo (`195 kr`) seeding in `/admin/seeding-lab`.
3. Curate and verify photos for remaining 9 staged pop-ups in `/admin/seeding-lab`.

## Decisions (don't reopen)
- Product is Smakr; the app lives in `frontend/`.
- `backend/` is retired FastAPI: never scan, edit, or revive it.
- Weekly drop is stored in `weekly_picks`, not `weekly_drop`.
- Docs: `GEMINI.md` router, `AGENT_BRIEF.md` contract, `DESIGN_SYSTEM.md` visual source.

## Open / TODO
- TODO-VERIFY: confirm partner claim copy before launch.

## Recent (max 5, one line each)
- 2026-11-15 — Shipped 2-slide Early Snowfall (`oslo-snowfall-bowls`) Preset 2 + real bowl photos in `CarouselStoryDeck.tsx`; `npx tsc --noEmit` clean
- 2026-11-15 — Audited `place_photos`, wired `place_photos` + `opening_hours` in seeding lab/`serverData.ts`, and expanded Hrimnir + Sapporo to 7 curated photos
- 2026-11-14 — Shipped Tasks 1–6: lab guards, map-first dock & GPS pill, deduped location/pop-up sheets, `SmakrFoodieInviteModal` + moderated submission queue, 4-block feed rhythm, `/makr` studio, & `/admin` Pending Approvals tab; `npx tsc --noEmit` + `390x844` clean
- 2026-11-14 — Mounted Skiper 39 crowd boot on `/` (`HomeView.tsx`) with instant 21-cell starter streaming, spring logo + radar ping, and collapsible mobile Boot Lab controls; `npx tsc --noEmit` clean
