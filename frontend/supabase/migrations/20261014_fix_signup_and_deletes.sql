-- ============================================================================
-- Smakr — fix signup ("Database error creating new user") + admin deletes
-- ============================================================================
-- Run once in the Supabase Dashboard → SQL Editor (or `supabase db push`).
--
-- WHY: creating an auth user failed with 500 "Database error creating new user".
-- The `handle_new_user` trigger could not insert the matching public.profiles
-- row because `profiles.handle` is NOT NULL (and unique) and RLS is enabled on
-- `profiles` with no INSERT policy — so the whole auth transaction rolled back.
-- This replaces the trigger with a robust SECURITY DEFINER version, and makes
-- admin row-deletes cascade cleanly so the Control Center can remove venues
-- and dishes.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1) Robust `handle_new_user`: always derives a valid, unique @handle
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  candidate   text;
  suffix      int := 0;
begin
  -- Prefer explicit signup metadata, then the email local part.
  base_handle := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'user_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'handle'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'foodie'
  );

  -- Normalise: lower-case, strip leading @/_/space, keep [a-z0-9._-].
  base_handle := regexp_replace(lower(base_handle), '^[@_[:space:]]+', '');
  base_handle := regexp_replace(base_handle, '[^a-z0-9._-]+', '_', 'g');
  base_handle := nullif(trim(both '_' from base_handle), '');
  if base_handle is null then
    base_handle := 'foodie';
  end if;
  base_handle := left(base_handle, 40);

  -- Guarantee uniqueness (ignoring a leading `@` and case).
  candidate := base_handle;
  while exists (
    select 1
    from public.profiles p
    where lower(regexp_replace(coalesce(p.handle, ''), '^@', '')) = lower(candidate)
  ) loop
    suffix := suffix + 1;
    candidate := left(base_handle, 36) || '_' || suffix::text;
  end loop;

  insert into public.profiles (id, handle, name, avatar_url, role, is_official)
  values (
    new.id,
    candidate,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      candidate
    ),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    'foodie',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 2) Let a signed-in user create their own profile row (client fallback)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ---------------------------------------------------------------------------
-- 3) Cascade deletes so admin removals clean up dependants
--    (drop any existing FK on these columns first, then re-create with CASCADE)
-- ---------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select con.conname, rel.relname as tbl
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.contype = 'f'
      and ns.nspname = 'public'
      and (rel.relname, att.attname) in (
        ('post_likes', 'post_id'),
        ('post_saves', 'post_id'),
        ('food_posts', 'venue_id'),
        ('weekly_picks', 'venue_id')
      )
  loop
    execute format('alter table public.%I drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

alter table public.post_likes
  add constraint post_likes_post_id_fkey
  foreign key (post_id) references public.food_posts (id) on delete cascade;

alter table public.post_saves
  add constraint post_saves_post_id_fkey
  foreign key (post_id) references public.food_posts (id) on delete cascade;

alter table public.food_posts
  add constraint food_posts_venue_id_fkey
  foreign key (venue_id) references public.venues (id) on delete cascade;

alter table public.weekly_picks
  add constraint weekly_picks_venue_id_fkey
  foreign key (venue_id) references public.venues (id) on delete cascade;


-- ---------------------------------------------------------------------------
-- 4) Re-assert the admin write policies (idempotent — safe to re-run)
--    Admins are identified via public.profiles.role = 'admin'.
-- ---------------------------------------------------------------------------
drop policy if exists "venues_admin_insert" on public.venues;
create policy "venues_admin_insert"
  on public.venues for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "venues_admin_update" on public.venues;
create policy "venues_admin_update"
  on public.venues for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "venues_admin_delete" on public.venues;
create policy "venues_admin_delete"
  on public.venues for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "food_posts_admin_insert" on public.food_posts;
create policy "food_posts_admin_insert"
  on public.food_posts for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or author_id = auth.uid()
  );

drop policy if exists "food_posts_admin_update" on public.food_posts;
create policy "food_posts_admin_update"
  on public.food_posts for update to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or author_id = auth.uid()
  );

drop policy if exists "food_posts_admin_delete" on public.food_posts;
create policy "food_posts_admin_delete"
  on public.food_posts for delete to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or author_id = auth.uid()
  );

drop policy if exists "weekly_picks_admin_insert" on public.weekly_picks;
create policy "weekly_picks_admin_insert"
  on public.weekly_picks for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "weekly_picks_admin_update" on public.weekly_picks;
create policy "weekly_picks_admin_update"
  on public.weekly_picks for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "weekly_picks_admin_delete" on public.weekly_picks;
create policy "weekly_picks_admin_delete"
  on public.weekly_picks for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---------------------------------------------------------------------------
-- 5) Dish photo uploads (Supabase Storage) — ensure bucket + policies exist
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dish-photos',
  'dish-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dish_photos_public_read" on storage.objects;
create policy "dish_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'dish-photos');

drop policy if exists "dish_photos_auth_insert" on storage.objects;
create policy "dish_photos_auth_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dish-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dish_photos_owner_update" on storage.objects;
create policy "dish_photos_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'dish-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dish_photos_owner_delete" on storage.objects;
create policy "dish_photos_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'dish-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Ask PostgREST to pick up the changes immediately.
notify pgrst, 'reload schema';
