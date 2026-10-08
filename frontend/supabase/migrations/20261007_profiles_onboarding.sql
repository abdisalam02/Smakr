-- ============================================================================
-- Smakr — 15-second onboarding fields on public.profiles
-- ============================================================================
-- Run this in the Supabase Dashboard → SQL Editor (or via `supabase db push`).
-- The app degrades gracefully until this is applied: the onboarding modal still
-- works in-session, but the result is not persisted to Supabase.
--
-- (The project's DATABASE_URL currently contains the literal `[YOUR-PASSWORD]`
--  placeholder, so it cannot be applied via psql from the repo.)
-- ============================================================================

alter table public.profiles
  add column if not exists avatar_config jsonb default '{
    "presentation": "neutral",
    "skinTone": "f2d3b1",
    "hairStyle": "clean-short",
    "clothingColor": "e84a27",
    "accessory": "none"
  }'::jsonb,
  add column if not exists onboarding_completed boolean not null default false;

-- ---------------------------------------------------------------------------
-- RLS: let a signed-in user read + update their OWN profile row.
-- (The `handle_new_user` trigger already INSERTs the row; these policies let
--  the onboarding modal UPDATE it.)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Ask PostgREST to pick up the new columns immediately.
notify pgrst, 'reload schema';
