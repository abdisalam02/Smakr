-- ============================================================================
-- Smakr — per-user mascot configuration on public.profiles
-- ============================================================================
-- Adds `mascot_config jsonb` so a user's Mascot Studio look follows their
-- account instead of living only in the browser's localStorage.
--
-- Run in the Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Until applied, the app degrades gracefully: the mascot stays browser-local.
-- ============================================================================

alter table public.profiles
  add column if not exists mascot_config jsonb;

notify pgrst, 'reload schema';
