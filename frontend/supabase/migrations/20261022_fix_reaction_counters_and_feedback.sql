-- ============================================================================
-- Smakr: reaction counter + beta feedback repair
-- Run in the Supabase SQL Editor. Idempotent.
--
-- Symptoms this fixes:
--   * One like/save increments likes_count/saves_count by 2.
--   * Browser beta-feedback inserts return 401/403.
--
-- The application also has a server-side feedback route and reaction
-- reconciliation route, but this migration fixes the root cause.
-- ============================================================================

-- 1) Remove stale/duplicate reaction triggers, keeping only the canonical ones.
do $$
declare
  r record;
begin
  for r in
    select c.relname as table_name, t.tgname as trigger_name
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname in ('post_likes', 'post_saves')
      and not t.tgisinternal
      and t.tgname not in (
        'trg_sync_post_like_count',
        'trg_sync_post_save_count'
      )
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      r.trigger_name,
      r.table_name
    );
  end loop;
end $$;

-- 2) Recreate the canonical counter triggers exactly once.
create or replace function public.sync_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.food_posts
    set likes_count = coalesce(likes_count, 0) + 1
    where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.food_posts
    set likes_count = greatest(0, coalesce(likes_count, 0) - 1)
    where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_post_like_count on public.post_likes;
create trigger trg_sync_post_like_count
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_like_count();

create or replace function public.sync_post_save_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.food_posts
    set saves_count = coalesce(saves_count, 0) + 1
    where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.food_posts
    set saves_count = greatest(0, coalesce(saves_count, 0) - 1)
    where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_post_save_count on public.post_saves;
create trigger trg_sync_post_save_count
  after insert or delete on public.post_saves
  for each row execute function public.sync_post_save_count();

-- 3) Reconcile existing drifted counters.
update public.food_posts p
set likes_count = coalesce(
      (select count(*)::int from public.post_likes l where l.post_id = p.id),
      0
    ),
    saves_count = coalesce(
      (select count(*)::int from public.post_saves s where s.post_id = p.id),
      0
    );

-- 4) Beta feedback: anonymous/authenticated inserts, no public reads.
alter table public.beta_feedback enable row level security;

drop policy if exists "beta_feedback_insert_any" on public.beta_feedback;
create policy "beta_feedback_insert_any"
  on public.beta_feedback for insert
  to anon, authenticated
  with check (true);

grant insert on public.beta_feedback to anon, authenticated;

notify pgrst, 'reload schema';
