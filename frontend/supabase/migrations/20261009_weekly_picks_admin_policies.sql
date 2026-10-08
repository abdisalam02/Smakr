-- ============================================================================
-- Smakr — Weekly Drop admin write policies
-- ============================================================================
-- Run in Supabase Dashboard → SQL Editor (or `supabase db push`).
--
-- Enables the Control Center "Broadcast Dispatch" action to upsert the active
-- row in public.weekly_picks. Reads stay public so the home feed and map can
-- always show the current drop. Admins are identified via
-- public.profiles.role = 'admin'.
-- ============================================================================

alter table public.weekly_picks enable row level security;

drop policy if exists "weekly_picks_public_read" on public.weekly_picks;
create policy "weekly_picks_public_read"
  on public.weekly_picks for select
  using (true);

drop policy if exists "weekly_picks_admin_insert" on public.weekly_picks;
create policy "weekly_picks_admin_insert"
  on public.weekly_picks for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "weekly_picks_admin_update" on public.weekly_picks;
create policy "weekly_picks_admin_update"
  on public.weekly_picks for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "weekly_picks_admin_delete" on public.weekly_picks;
create policy "weekly_picks_admin_delete"
  on public.weekly_picks for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

notify pgrst, 'reload schema';
