# GEMINI.md: CityPulse (Smakr — Oslo food discovery radar)

Project rules only. Workspace rules live in the root `AGENTS.md`. **This file wins on project conflicts.**
Canonical rules file. `AGENTS.md` points here; `CLAUDE.md` imports this file.

## 0. Start every task here
1. Read `docs/STATE.md`, then `docs/ARCHITECTURE.md`. `docs/AGENT_BRIEF.md` is the detailed contract.
2. Open files strictly by line range. Never read a file over 500 lines whole.
3. Verify from `frontend/` with `npx tsc --noEmit`. Security changes also run `npm run test:security`.
4. Update `docs/STATE.md` (max 5 lines). Older history lives in `docs/archive/` and is not read.

| File | Read when |
|---|---|
| `docs/STATE.md` | always, first |
| `docs/ARCHITECTURE.md` | always, second |
| `docs/AGENT_BRIEF.md` | hard boundaries and active paths |
| `docs/DESIGN.md` | any UI, colour, type, card, or avatar change |
| `docs/MASCOT_SVG_FIX_GUIDE.md` | mascot or SVG work |

## 1. Identity and scope
- Product: Smakr, a live food-discovery radar for Oslo (venues, dish posts, weekly drop).
- Stack: Next.js 15 App Router, Supabase, MapLibre GL, Zustand, Tailwind.
- App location: `frontend/`. Dev port 3001.
- Entry: `frontend/src/app/page.tsx` -> `frontend/src/components/home/HomeView.tsx`.

## 2. Hard boundaries
- `backend/` is a retired FastAPI service. Never scan, read, refactor, or modify it.
- Dead code: `frontend/src/components/checkin/QuickCheckInModal.tsx` and `SpeedTestWidget.tsx`.
- Never broad-search when a component is named. Use the active-path map in `AGENT_BRIEF.md`.
- Do not cross-import from other workspace projects.

## 3. Commands (from `frontend/`)
| Task | Command |
|---|---|
| Dev | `npm run dev` (3001) |
| Type check | `npx tsc --noEmit` |
| Security test | `npm run test:security` |
| Audit | `npm run security:audit` |
| Build | `npm run build` |

## 4. Data and security invariants
- Initial reads are server-prefetched in `lib/supabase/serverData.ts`; client mutations live in `data.ts`.
- Keep row shapes identical through `lib/supabase/mappers.ts`.
- Kitchen tokens live in the private `venue_kitchen_tokens` table, never public JSONB.
- Never expose service-role keys or kitchen tokens to the client.

## 5. Design
- Read `docs/DESIGN.md` (alias of `DESIGN_SYSTEM.md`) before UI work.
- Burnt Paprika `#e84a27` is the only primary accent. Warm Oat canvas, Espresso text.
- No purple gradients, glassmorphism orbs, bento grids, or unapproved palettes.

## 6. Stop gates
- `git push`, deploy, or destructive database operations.
- Editing `frontend/supabase/migrations`, RLS policies, or kitchen token auth.
- New dependencies, trackers, or CDN fonts.
- Partner-facing legal copy, prices, or claim wording.
- Deleting files.
