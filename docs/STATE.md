# STATE.md — CityPulse / Smakr (read first, keep <= 30 lines)

Updated: 2026-11-28

## Now
- Security hardening pass complete: gated `/api/partner/{upload,propose}`, `/api/places/details`, `/api/reactions/reconcile`, dev `NODE_ENV` bypasses in `/api/admin/save-{mascot-svg,studio-icon}`, & enforced `profiles.role === "admin"` + `/ad-reel` + lab routes in `middleware.ts`.
- Added strict HSTS/CSP + tight `remotePatterns` in `next.config.ts`, `*.vercel.app` -> `smakr.no` redirect, PostHog host allowlist, `mappers.ts` `vibe_signals` token/queue strip, redirect SSRF checks, & desktop popup HTML escaping.
- Prior uncommitted staging intact: `KfcOsloAd` `v19` rendered (`24.56 MiB`, 60fps mobile H.264 synced to `frontend/public/videos/oslo-fried-chicken-reel.mp4`) + `Hot Temper`/`Down South Deli` staged in `frontend/curation/staged_candidates.json`.

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
- 2026-11-28 — Fixed horizontal shelf left-edge clipping (`FeedMotionLanes.tsx`), switched Kitchens swimlane to venue covers (`HomeView.tsx`), hid redundant pop-up date row & allowed pull-down over carousels (`VenueBottomSheet.tsx`), trimmed boot hold to `1.30s`, & added `scripts/check-performance.mjs` + `npm run verify`
- 2026-11-28 — Generated 512px WebP food icons (`grilled_chicken`, `korean_corndog`, `curry` + `indian`) via zero-shadow cutout pipeline and mapped Pele Pele, Korndokki, and Masala Politics in `FoodIcons.tsx`, `iconRegistry.ts`, & `taxonomy.ts`; tsc clean
- 2026-11-28 — Boot screen Warm Oat + static Oslo map snapshot (`oslo-map-backdrop.webp`), solo `SMAKR` logo, sprite edge fade & +1s synchronized fade; fixed post-swipe `Details`/carousel tap deadtime, kept mobile Feed mounted, & hid restaurant/pop-up status pill on sheet scroll; tsc + security 70/70
- 2026-11-28 — Fixed Seeding Lab third-party web-search image CSP/hotlink blocks via admin `/api/admin/proxy-web-image` + `toAdminPreviewImageUrl`, & added "Add with AI" (`/api/admin/suggest-dishes`) w/ live web search & deduplication; tsc + security 70/70
- 2026-11-26 — Shipped `KfcOsloAd` `v19` (`31.25s`, `24.56 MiB` High@L4.2 bt709): centered short-neck Colonel bow tie, `STORO` sign, full right-exit/left-entry mascot w/ slower curtain unblur, endless 3-dish coverflow, bigger steady bubble, & `Discover more spots` CTA; `frontend` tsc clean
