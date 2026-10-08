# AGENT_BRIEF.md — Smakr (Oslo Food Discovery Radar)

> Read this first. It is the contract for every AI coding assistant (Antigravity, Cursor, Claude Code) working in this repo.

**Project identity:** Smakr is a **Next.js 15 (App Router) + Supabase + MapLibre GL + Zustand** web app that surfaces a live "food discovery radar" for Oslo — venue pins, community dish posts, and a weekly featured drop.

**Repo layout reminder:** the Next.js app lives in `frontend/`. Unless a path starts with a top-level folder (`backend/`, `docs/`), every path below is relative to `frontend/`.

---

## 0. Start every task here
1. Read `docs/ARCHITECTURE.md` (route + data map). Read `docs/DESIGN_SYSTEM.md` only if the task touches UI.
2. Open only the mapped file, by line range. Never read a >500-line file whole (see *Big files* in `ARCHITECTURE.md`).
3. Verify with `npx tsc --noEmit` (run from `frontend/`). Only run a full `npm run build` for structural changes.
4. If behavior changed, append ≤5 lines to `docs/STATE.md`.

| File | Read when |
|---|---|
| `docs/ARCHITECTURE.md` | always, second |
| `docs/DESIGN_SYSTEM.md` | any UI, color, type, card, or avatar change |
| `docs/STATE.md` | resume point / recent changes |
| `README.md` | environment and run instructions |

---

## 1. Hard boundaries (do not cross)
- **`backend/` is off-limits.** It is a retired FastAPI/Postgres service. **DO NOT scan, read, refactor, or modify `backend/`** — no active logic lives there. All live behavior is in Next.js Server Components/Routes (`frontend/src/app`, `frontend/src/lib`) and Supabase.
- **Obsolete check-in / speed-test files are dead code.** Do not scan, wire up, or "fix" them:
  - `frontend/src/components/checkin/QuickCheckInModal.tsx`
  - `frontend/src/components/checkin/SpeedTestWidget.tsx`
- **No broad codebase searches when a single component is named.** Use the *Active core paths* map below and go straight to the file. Grep only for exact identifiers.
- **No unsolicited refactors.** Stay strictly inside the blast radius of the requested task.

---

## 2. Active core paths
| Feature | Location |
|---|---|
| Feeds, dish posts, cards | `frontend/src/components/food/` |
| Map, radar pins, filters, controls | `frontend/src/components/map/` |
| Onboarding modal & avatars | `frontend/src/components/auth/UserOnboardingModal.tsx`, `frontend/src/components/avatar/` |
| Avatar generation logic | `frontend/src/lib/onboardingAvatar.ts` |
| Admin & venue/post importer | `frontend/src/components/admin/` (also `frontend/src/app/admin/page.tsx`) |
| Global state (Zustand) | `frontend/src/store/useCityPulseStore.ts` |
| Supabase data layer | `frontend/src/lib/supabase/` |
| Server page entry | `frontend/src/app/page.tsx` → `frontend/src/components/home/HomeView.tsx` |

> Note: there is **no** `src/components/onboarding/` folder — onboarding UI lives in `components/auth/` and `components/avatar/`.

---

## 3. Working & token rules
1. **Search before reading.** Never load `node_modules/`, `.next/`, lockfiles, `backend/`, or `*.tsbuildinfo`.
2. **Surgical in-place edits only.** Never rewrite whole files.
3. **Output limits.** Plan in ≤10 lines; final answer in ≤8 lines (what changed, files touched, open items). Do not paste long diffs or full files.
4. **Verify once at the end** (`npx tsc --noEmit`). Fix at most twice, then stop and report blockers.
5. **Respect the two data layers.** Initial reads are server-prefetched in `lib/supabase/serverData.ts`; client reads/mutations live in `lib/supabase/data.ts`. Keep mapped row shapes identical via `lib/supabase/mappers.ts`.

## 4. Stop gates (ask first)
- `git push`, deploys, or destructive DB/schema changes (`frontend/supabase/migrations`).
- Adding third-party scripts, analytics, or new dependencies.
- Deleting files or removing RLS policies.
- Changing the avatar engine, the theme token system, or the brand color `#e84a27`.
