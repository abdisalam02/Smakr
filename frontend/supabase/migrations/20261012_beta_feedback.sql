-- ============================================================================
-- Smakr — private beta feedback table
-- ============================================================================
-- Run in the Supabase Dashboard → SQL Editor (or `supabase db push`).
-- The in-app Beta Feedback drawer (components/feedback/BetaFeedbackDrawer.tsx)
-- inserts into public.beta_feedback; the app degrades gracefully (toast only)
-- until this is applied.
-- ============================================================================

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  user_email text,
  user_handle text,
  category text not null default 'other',
  feedback text not null,
  device_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists beta_feedback_created_at_idx
  on public.beta_feedback (created_at desc);

alter table public.beta_feedback enable row level security;

-- Testers (signed in or anonymous) may submit feedback only.
drop policy if exists "beta_feedback_insert_any" on public.beta_feedback;
create policy "beta_feedback_insert_any"
  on public.beta_feedback for insert
  with check (true);

-- No public read policy: only the service role / dashboard can read submissions.

notify pgrst, 'reload schema';
