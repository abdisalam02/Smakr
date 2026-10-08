# ARCHITECTURE.md — Smakr Codebase Map

> Keep this file updated when routes, components, or tables move. Read it before searching. Open files by line range; never read a "Big file" whole.

## 1. Directory overview
| Component | Location | Role |
|---|---|---|
| Next.js app | `frontend/` | Next.js 15 App Router UI + server routes (the product) |
| Data layer & migrations | `frontend/src/lib/supabase/`, `frontend/supabase/migrations/` | Supabase clients, mappers, SQL migrations |
| Backend (retired) | `backend/` | Legacy FastAPI service — **DO NOT touch** |
| Docs | `docs/` | Agent briefs, architecture map, design system |

## 2. Rendering model (server-first)
- `frontend/src/app/page.tsx` (30 lines) is a Server Component with `export const dynamic = "force-dynamic"`. It runs three reads in parallel:
  `Promise.all([fetchVenuesServer(), fetchFoodPostsServer(), fetchActiveWeeklyDropServer()])`.
- Those readers live in `frontend/src/lib/supabase/serverData.ts` — a server-only anon client (`@supabase/supabase-js`) with `fetch(..., { cache: "no-store" })` so admin edits show immediately.
- The result is passed as `initialData` to the client component `frontend/src/components/home/HomeView.tsx`, which seeds the Zustand store in a layout effect. First paint already contains the feed, map pins and weekly drop — there is no client-side waterfall and no skeleton flash.
- Session/auth uses `@supabase/ssr` (`createServerClient` / `createBrowserClient`) in `frontend/src/middleware.ts`, `frontend/src/lib/supabase/server.ts`, `frontend/src/lib/supabase/client.ts`, and `frontend/src/app/auth/callback/route.ts`.

## 3. Map decoupling
- `MapRadarView` is loaded with `next/dynamic(..., { ssr: false })` in `HomeView.tsx` (lines 29–42), with a radar spinner fallback. MapLibre is a large dependency and must never block first paint or hydration.

## 4. Data layers (Supabase)
| Table / asset | Purpose | Read / write |
|---|---|---|
| `venues` | Restaurant metadata: name, coordinates (lat/lng), area, Google place info, cover images | `serverData.ts` (read); `data.ts`, `components/admin/VenueImporter.tsx` (write) |
| `food_posts` | Community + curated dish posts: price, taste notes, diner quotes, images; FKs to `venues` and `profiles` | `serverData.ts` / `data.ts` (read + write); `components/food/CreateFoodPostModal.tsx`, `components/admin/EditPostModal.tsx` |
| `weekly_picks` | The Weekly Drop: one active featured dish + mascot pick (`is_active`, `dish_name`, `dish_image`, `speech_bubble`, `week_label`, `price_nok`, coords) | `serverData.ts` (`fetchActiveWeeklyDropServer`) |
| `profiles` | Author handle, name, `avatar_url`, `is_official` | embedded in `food_posts` selects |
| Storage bucket `dish-photos` | Public bucket for user-uploaded meal photos | `components/food/CreateFoodPostModal.tsx` (`storage.from("dish-photos")`) |

> The Weekly Drop is stored in the **`weekly_picks`** table; `weekly_drop` is not a table.

## 5. Route → file matrix
| Route | File |
|---|---|
| `/` (feed + map) | `frontend/src/app/page.tsx` → `frontend/src/components/home/HomeView.tsx` |
| `/admin` | `frontend/src/app/admin/page.tsx` |
| `/mascot-studio` | `frontend/src/app/mascot-studio/page.tsx` |
| `/auth/*` | `frontend/src/app/auth/**`, `frontend/src/app/auth/callback/route.ts` |
| `/collections` | `frontend/src/app/collections/**` |
| API routes | `frontend/src/app/api/**` |
| Auth / session middleware | `frontend/src/middleware.ts` |

## 6. Big files (>500 lines: use line ranges only)
| File | Lines |
|---|---|
| `frontend/src/components/food/CreateFoodPostModal.tsx` | 1128 |
| `frontend/src/components/admin/VenueImporter.tsx` | 1030 |
| `frontend/src/components/map/MapRadarView.tsx` | 943 |
| `frontend/src/app/admin/page.tsx` | 931 |
| `frontend/src/lib/onboardingAvatar.ts` | 798 |
| `frontend/src/components/home/HomeView.tsx` | 682 |
| `frontend/src/lib/supabase/data.ts` | 647 |
| `frontend/src/store/useCityPulseStore.ts` | 634 |

## 7. Sources of truth
- `frontend/src/types/index.ts` — domain types (`Venue`, `FoodPost`, `WeeklyPick`).
- `frontend/src/lib/supabase/mappers.ts` — row → domain shape (identical for client and server).
- `frontend/tailwind.config.ts` — color/font tokens (`colors.smakr`, `font-comico`).
- `frontend/src/app/globals.css` — theme CSS variables (`--background`, `--surface`, `--surface-raised`, `--surface-border`).
- `docs/DESIGN_SYSTEM.md` — visual standards.
