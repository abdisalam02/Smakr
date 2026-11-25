# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-25

## Now
- Task: Shipped `KfcOsloAd` `v15` (`22.90s` / `1374f`): traced South Park Colonel face inside `#KfcProjectingBucketSign`, shortened & aligned spot tags (`29px` uniform italic, zero collision), deepened Scene 2/3 bottom Warm Oat fade (`345px`), & extended Scene 3 Finale hold to `5.0s` (`300f`); synced `/ad-reel?tab=chicken_reel`.
- Staged `Hot Temper` (6 cached Supabase photos) + enriched `Down South Deli` (`Birdman's Burger 269 kr`, `Crispy Thighs 279 kr`) in `frontend/curation/staged_candidates.json`.
- Status: Both `frontend/` & `video-studio/` `npx tsc --noEmit`, 4 `v15` QA stills (`f045`, `f440`, `f780`, `f1350`), `v15` MP4 (`28.2 MB` + `<20MB` `9.3 MiB`), & `/videos/oslo-fried-chicken-reel.mp4` exited 0; `v6`–`v14` preserved.

## Next (max 3)
1. User to review & confirm KFC Storo storefront, VEKTER guard, spot logos/photos, and rendered 60fps motion preview (`kfc_ad_assets_and_motion_preview.md`).
2. User to curate & seed `Hot Temper` + `Down South Deli` (and verify PAN's `149 kr` dish price) in `/admin/seeding-lab`.
3. Add voiceover / beat audio track + any user motion tweaks in `video-studio/`, then export final cut.

## Decisions (don't reopen)
- Product is Smakr; the app lives in `frontend/`.
- `backend/` is retired FastAPI: never scan, edit, or revive it.
- Weekly drop is stored in `weekly_picks`, not `weekly_drop`.
- Docs: `GEMINI.md` router, `AGENT_BRIEF.md` contract, `DESIGN_SYSTEM.md` visual source.

## Open / TODO
- TODO-VERIFY: confirm partner claim copy before launch.

## Recent (max 5, one line each)
- 2026-11-16 — Built hybrid pop-up scraper: Playwright CLI (`sync:popups`), Apify IG fallback, NO/EN date-time-location parser, `public/popup-sync-report.json`, and admin `sync-popups` queue route; tsc + security 23/23
- 2026-11-16 — Fixed `/admin` persistence & admin APIs: makr pop-up UUID insert, kitchen-token link, official-pick/weekly-drop persistence, seeder author FK, publish/archive toggles, shared `requireAdmin()`; tsc + security clean
- 2026-11-15 — Shipped 2-slide Early Snowfall (`oslo-snowfall-bowls`) Preset 2 + real bowl photos in `CarouselStoryDeck.tsx`; `npx tsc --noEmit` clean
- 2026-11-15 — Audited `place_photos`, wired `place_photos` + `opening_hours` in seeding lab/`serverData.ts`, and expanded Hrimnir + Sapporo to 7 curated photos
- 2026-11-14 — Shipped Tasks 1–6: lab guards, map-first dock & GPS pill, deduped location/pop-up sheets, `SmakrFoodieInviteModal` + moderated submission queue, 4-block feed rhythm, `/makr` studio, & `/admin` Pending Approvals tab; `npx tsc --noEmit` + `390x844` clean
