-- ============================================================================
-- Smakr Oslo — 20261020 schema alignment, security hardening & integrity
-- ============================================================================
-- Companion to the 2026-10-19 gap analysis (7-vector audit).
--
-- DESIGN RULES
--   * Idempotent: every statement is safe to run more than once.
--   * Non-destructive: no drops of business columns, no data wipes.
--   * Canonical columns stay canonical:
--       - venues.image_url        (NOT cover_image_url)
--       - venues.category         (NOT food_category)
--       - food_posts.dish_name    (NOT title)
--       - food_posts.dish_image   (NOT image_url)
--       - food_posts.price_nok    (NOT price)
--       - food_posts.review_text  (NOT description/taste_note)
--       - weekly_picks            (NOT weekly_drops)
--   * Run top-to-bottom in the Supabase SQL Editor. Each block is independent,
--     so a failure can be fixed and the script re-run safely.
--
-- NOTE ON INDEXES
--   The live dataset is small (13 venues / 14 dishes), so plain CREATE INDEX
--   is used for editor compatibility. On a large dataset, run the index
--   statements manually with CREATE INDEX CONCURRENTLY (outside a transaction).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0) Helper: admin predicate (used by RLS + guard triggers)
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 1) Missing columns the TypeScript domain already reads/writes
-- ----------------------------------------------------------------------------
-- venues -------------------------------------------------------------------
alter table public.venues
  -- Used by Feed/Map search + cards; currently always [] after mapping.
  add column if not exists signature_dishes text[] not null default '{}'::text[],
  -- Used by venue cards / partner previews.
  add column if not exists description text,
  -- Used by the partner card + weekly previews.
  add column if not exists current_opening_hours_text text,
  -- Used by the "Staff Picks" venue filter.
  add column if not exists is_official_pick boolean not null default false;

-- food_posts ---------------------------------------------------------------
alter table public.food_posts
  -- Used by search, FoodPostCard and DishDetailPopup; mapper currently forces [].
  add column if not exists taste_tags text[] not null default '{}'::text[],
  -- FoodPost domain fields that were never persisted.
  add column if not exists drop_badge text,
  add column if not exists item_availability text,
  -- Used by the feed price-tier filter and FoodPostCard.
  add column if not exists price_tier text;

-- weekly_picks -------------------------------------------------------------
alter table public.weekly_picks
  -- MascotWeeklyDrop reads this; it was never a column.
  add column if not exists mascot_avatar_url text;


-- ----------------------------------------------------------------------------
-- 2) Partner claims (20261018 is not applied on the live project)
-- ----------------------------------------------------------------------------
create table if not exists public.partner_claims (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  applicant_name text not null,
  applicant_role text not null check (applicant_role in ('owner', 'chef', 'manager', 'staff')),
  applicant_email text not null,
  applicant_phone text,
  applicant_instagram text,
  org_number text,
  proposed jsonb not null,
  snapshot jsonb,
  review_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_partner_claims_status_created
  on public.partner_claims (status, created_at desc);

create index if not exists idx_partner_claims_venue_status
  on public.partner_claims (venue_id, status);

-- Partial unique index: at most 1 pending claim per venue per applicant email.
do $$
begin
  if not exists (
    select 1
    from public.partner_claims
    group by venue_id, lower(applicant_email)
    having count(*) > 1
  ) then
    execute 'create unique index if not exists idx_partner_claims_pending_venue_email '
         || 'on public.partner_claims (venue_id, lower(applicant_email)) where status = ''pending''';
  else
    raise notice 'partner_claims: duplicate pending claims found — unique index skipped';
  end if;
end $$;

alter table public.partner_claims enable row level security;

drop policy if exists "partner_claims_admin_select" on public.partner_claims;
create policy "partner_claims_admin_select"
  on public.partner_claims for select to authenticated
  using (public.is_admin());

drop policy if exists "partner_claims_admin_insert" on public.partner_claims;
create policy "partner_claims_admin_insert"
  on public.partner_claims for insert to authenticated
  with check (public.is_admin());

drop policy if exists "partner_claims_admin_update" on public.partner_claims;
create policy "partner_claims_admin_update"
  on public.partner_claims for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "partner_claims_admin_delete" on public.partner_claims;
create policy "partner_claims_admin_delete"
  on public.partner_claims for delete to authenticated
  using (public.is_admin());


-- ----------------------------------------------------------------------------
-- 3) Kitchen tokens: move them out of the publicly readable venues row
-- ----------------------------------------------------------------------------
-- CRITICAL: venues.vibe_signals is public SELECT, so
-- vibe_signals->kitchen_status->>kitchen_token leaked every partner token.
-- Tokens now live in a table that has no anon policy.
create table if not exists public.venue_kitchen_tokens (
  venue_id uuid primary key references public.venues(id) on delete cascade,
  kitchen_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The UNIQUE constraint on kitchen_token above already provides the lookup index.
alter table public.venue_kitchen_tokens enable row level security;

drop policy if exists "venue_kitchen_tokens_admin_all" on public.venue_kitchen_tokens;
create policy "venue_kitchen_tokens_admin_all"
  on public.venue_kitchen_tokens for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Backfill existing tokens before stripping them from the public JSONB.
insert into public.venue_kitchen_tokens (venue_id, kitchen_token)
select
  v.id,
  v.vibe_signals #>> '{kitchen_status,kitchen_token}'
from public.venues v
where coalesce(v.vibe_signals #>> '{kitchen_status,kitchen_token}', '') <> ''
on conflict do nothing;

-- Strip the secret from the public column while keeping the public status.
update public.venues
set vibe_signals = jsonb_set(
  vibe_signals,
  '{kitchen_status}',
  (vibe_signals -> 'kitchen_status') - 'kitchen_token',
  false
)
where vibe_signals -> 'kitchen_status' ? 'kitchen_token';

-- (venue_id is already the primary key / index of venue_kitchen_tokens.)


-- ----------------------------------------------------------------------------
-- 4) Data backfills / normalisation (no destructive changes)
-- ----------------------------------------------------------------------------
-- 4a) food_posts.category was nullable; recover it from the legacy cat_* tag.
--     Also repairs categories written by an earlier faulty backfill (e.g. 'cat_co').
update public.food_posts p
set category = substring(t.tag from 5)
from (
  select id, min(t) as tag
  from public.food_posts, unnest(coalesce(dietary_tags, '{}'::text[])) as t
  where left(t, 4) = 'cat_'
  group by id
) t
where p.id = t.id
  and (p.category is null or left(p.category, 4) = 'cat_');

-- 4b) Normalise profiles.handle: the DB mixes "@name" and "name".
--     The UI already strips the leading @, so normalising is display-neutral.
do $$
begin
  if not exists (
    select 1
    from (
      select lower(regexp_replace(handle, '^@+', '')) as h, count(*) as c
      from public.profiles
      where handle is not null
        and length(regexp_replace(handle, '^@+', '')) > 0
      group by 1
    ) x
    where x.c > 1
  ) then
    update public.profiles
    set handle = regexp_replace(handle, '^@+', '')
    where handle like '@%'
      and length(regexp_replace(handle, '^@+', '')) > 0;

    execute 'create unique index if not exists profiles_handle_norm_uidx '
         || 'on public.profiles (lower(handle))';
  else
    raise notice 'profiles.handle: case-insensitive duplicates after normalisation — unique index skipped';
  end if;
end $$;

-- 4c) Reconcile denormalised counters with the join tables.
update public.food_posts p
set likes_count = coalesce((select count(*)::int from public.post_likes l where l.post_id = p.id), 0),
    saves_count = coalesce((select count(*)::int from public.post_saves s where s.post_id = p.id), 0);


-- ----------------------------------------------------------------------------
-- 5) Indexes & constraints (dedupe + 60fps map/feed reads)
-- ----------------------------------------------------------------------------
-- venues: one row per Google place (prevents duplicate imports under race).
do $$
begin
  if not exists (
    select 1
    from public.venues
    where google_place_id is not null
    group by google_place_id
    having count(*) > 1
  ) then
    execute 'create unique index if not exists venues_google_place_id_uidx '
         || 'on public.venues (google_place_id) where google_place_id is not null';
  else
    raise notice 'venues.google_place_id: duplicates found — unique index skipped';
  end if;
end $$;

-- venues: slug uniqueness (insertVenue already handles 23505 on this).
do $$
begin
  if not exists (
    select 1 from public.venues where slug is not null group by slug having count(*) > 1
  ) then
    execute 'create unique index if not exists venues_slug_uidx on public.venues (slug)';
  else
    raise notice 'venues.slug: duplicates found — unique index skipped';
  end if;
end $$;

create index if not exists venues_neighborhood_idx on public.venues (neighborhood);
create index if not exists venues_category_idx on public.venues (category);
create index if not exists venues_spot_type_idx on public.venues (spot_type);
create index if not exists venues_is_official_pick_idx on public.venues (is_official_pick) where is_official_pick;

-- Pop-up residency filtering is done on vibe_signals today; make it indexable.
create index if not exists venues_popup_meta_gin on public.venues using gin (vibe_signals jsonb_path_ops);
create index if not exists venues_residency_status_idx
  on public.venues ((vibe_signals #>> '{popup_meta,residency_status}'));

-- Kitchen token lookups (legacy JSONB + new secrets table).
create index if not exists venues_kitchen_token_idx
  on public.venues ((vibe_signals #>> '{kitchen_status,kitchen_token}'));

-- food_posts: venue page, feed ordering, published/archived filtering.
create index if not exists food_posts_venue_id_idx on public.food_posts (venue_id);
create index if not exists food_posts_created_at_idx on public.food_posts (created_at desc);
create index if not exists food_posts_published_idx
  on public.food_posts (is_published, is_archived, created_at desc);

-- weekly_picks: at most one active drop.
do $$
begin
  if not exists (
    select 1 from public.weekly_picks where is_active group by is_active having count(*) > 1
  ) then
    execute 'create unique index if not exists weekly_picks_one_active_uidx '
         || 'on public.weekly_picks (is_active) where is_active';
  else
    raise notice 'weekly_picks: multiple active rows found — unique active index skipped';
  end if;
end $$;

-- Reactions: one row per user/post (upsert semantics become real).
do $$
begin
  if not exists (
    select 1 from public.post_likes group by user_id, post_id having count(*) > 1
  ) then
    execute 'create unique index if not exists post_likes_user_post_uidx '
         || 'on public.post_likes (user_id, post_id)';
  else
    raise notice 'post_likes: duplicate user/post rows found — unique index skipped';
  end if;

  if not exists (
    select 1 from public.post_saves group by user_id, post_id having count(*) > 1
  ) then
    execute 'create unique index if not exists post_saves_user_post_uidx '
         || 'on public.post_saves (user_id, post_id)';
  else
    raise notice 'post_saves: duplicate user/post rows found — unique index skipped';
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 6) RLS: public reads + least privilege writes
-- ----------------------------------------------------------------------------
alter table public.venues enable row level security;
alter table public.food_posts enable row level security;
alter table public.profiles enable row level security;
alter table public.weekly_picks enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_saves enable row level security;
alter table public.beta_feedback enable row level security;

-- Public catalogue reads (the app is a public food guide).
drop policy if exists "venues_public_read" on public.venues;
create policy "venues_public_read"
  on public.venues for select to anon, authenticated
  using (true);

drop policy if exists "food_posts_public_read" on public.food_posts;
create policy "food_posts_public_read"
  on public.food_posts for select to anon, authenticated
  using (true);

drop policy if exists "weekly_picks_public_read" on public.weekly_picks;
create policy "weekly_picks_public_read"
  on public.weekly_picks for select to anon, authenticated
  using (true);

-- Public mascot / social profile reads (logged-out map + feed avatars).
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
  on public.profiles for select to anon, authenticated
  using (true);

-- Own profile reads stay available (redundant with public, kept for clarity).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

-- Self insert cannot mint an admin.
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert to authenticated
  with check (
    auth.uid() = id
    and coalesce(role, 'foodie') = 'foodie'
    and coalesce(is_official, false) = false
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Reaction reads (own rows only; counters are denormalised on food_posts).
drop policy if exists "post_likes_select_own" on public.post_likes;
create policy "post_likes_select_own"
  on public.post_likes for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "post_saves_select_own" on public.post_saves;
create policy "post_saves_select_own"
  on public.post_saves for select to authenticated
  using (user_id = auth.uid());

-- Beta feedback: anonymous submit, no public read.
drop policy if exists "beta_feedback_insert_any" on public.beta_feedback;
create policy "beta_feedback_insert_any"
  on public.beta_feedback for insert to anon, authenticated
  with check (true);

-- Table grants (RLS still applies). Public read is intentionally table-wide.
grant usage on schema public to anon, authenticated;
grant select on public.venues, public.food_posts, public.profiles, public.weekly_picks
  to anon, authenticated;
grant insert, update, delete on public.food_posts to authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.post_likes, public.post_saves to authenticated;
grant insert on public.beta_feedback to anon, authenticated;
grant select, insert, update, delete on public.partner_claims to authenticated, service_role;
grant select, insert, update, delete on public.venue_kitchen_tokens to authenticated, service_role;

-- Defence in depth: these two objects must never be anon-readable. Supabase's
-- default privileges can otherwise leave anon with table-level SELECT (RLS then
-- returns an empty set, but a missing policy would leak rows).
revoke all on public.partner_claims from anon;
revoke all on public.venue_kitchen_tokens from anon;


-- ----------------------------------------------------------------------------
-- 7) Guard triggers: privilege escalation & curation integrity
-- ----------------------------------------------------------------------------
-- 7a) updated_at touch trigger
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_venues_touch_updated_at on public.venues;
create trigger trg_venues_touch_updated_at
  before update on public.venues
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_food_posts_touch_updated_at on public.food_posts;
create trigger trg_food_posts_touch_updated_at
  before update on public.food_posts
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_profiles_touch_updated_at on public.profiles;
create trigger trg_profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_weekly_picks_touch_updated_at on public.weekly_picks;
create trigger trg_weekly_picks_touch_updated_at
  before update on public.weekly_picks
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_venue_kitchen_tokens_touch_updated_at on public.venue_kitchen_tokens;
create trigger trg_venue_kitchen_tokens_touch_updated_at
  before update on public.venue_kitchen_tokens
  for each row execute function public.touch_updated_at();

-- 7b) A user may update their own profile but never grant themselves a role.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role / dashboard / SECURITY DEFINER jobs have no end-user JWT.
  if auth.uid() is null then
    return new;
  end if;

  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.role := 'foodie';
      new.is_official := false;
    elsif tg_op = 'UPDATE' then
      new.role := old.role;
      new.is_official := old.is_official;
      new.badge := old.badge;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile_privileges on public.profiles;
create trigger trg_guard_profile_privileges
  before insert or update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- 7c) Authors may edit their dish, but not self-promote it or rewrite counters.
--     pg_trigger_depth() > 1 allows the counter-sync triggers below to update
--     the denormalised counts without being blocked by this guard.
create or replace function public.guard_food_post_curation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if pg_trigger_depth() > 1 then
    return new;
  end if;
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
    new.is_official_pick := false;
    new.is_published := coalesce(new.is_published, true);
    new.is_archived := coalesce(new.is_archived, false);
    new.likes_count := 0;
    new.saves_count := 0;
    new.craving_count := 0;
    new.must_try_count := 0;
    new.tried_count := 0;
  else
    new.author_id := old.author_id;
    new.is_official_pick := old.is_official_pick;
    new.is_published := old.is_published;
    new.is_archived := old.is_archived;
    new.likes_count := old.likes_count;
    new.saves_count := old.saves_count;
    new.craving_count := old.craving_count;
    new.must_try_count := old.must_try_count;
    new.tried_count := old.tried_count;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_food_post_curation on public.food_posts;
create trigger trg_guard_food_post_curation
  before insert or update on public.food_posts
  for each row execute function public.guard_food_post_curation();

-- 7d) Keep likes_count / saves_count in sync with the join tables.
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


-- ----------------------------------------------------------------------------
-- 8) RPCs
-- ----------------------------------------------------------------------------
-- 8a) Atomic "Bring Back" counter for dormant pop-ups. Replaces the
--     localStorage-only reaction currently in PopupEventCard.
create or replace function public.increment_bring_back(p_venue_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.venues
  set vibe_signals = jsonb_set(
    jsonb_set(
      coalesce(vibe_signals, '{}'::jsonb),
      '{popup_meta}',
      coalesce(vibe_signals -> 'popup_meta', '{}'::jsonb),
      true
    ),
    '{popup_meta,bring_back_count}',
    to_jsonb(
      coalesce(
        nullif(regexp_replace(vibe_signals #>> '{popup_meta,bring_back_count}', '\D', '', 'g'), '')::integer,
        0
      ) + 1
    ),
    true
  )
  where id = p_venue_id
  returning coalesce(
    nullif(regexp_replace(vibe_signals #>> '{popup_meta,bring_back_count}', '\D', '', 'g'), '')::integer,
    0
  ) into v_count;

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.increment_bring_back(uuid) from public;
grant execute on function public.increment_bring_back(uuid) to anon, authenticated, service_role;

-- 8b) Atomic Weekly Drop broadcast: deactivate + insert in one transaction.
create or replace function public.broadcast_weekly_pick(
  p_venue_id uuid,
  p_dish_name text,
  p_dish_image text,
  p_price_nok integer,
  p_speech_bubble text,
  p_week_label text,
  p_latitude double precision,
  p_longitude double precision
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.weekly_picks set is_active = false where is_active = true;

  insert into public.weekly_picks (
    venue_id, dish_name, dish_image, price_nok, speech_bubble,
    week_label, latitude, longitude, is_active
  )
  values (
    p_venue_id, p_dish_name, coalesce(p_dish_image, ''), p_price_nok, p_speech_bubble,
    p_week_label, p_latitude, p_longitude, true
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.broadcast_weekly_pick(uuid, text, text, integer, text, text, double precision, double precision) from public;
grant execute on function public.broadcast_weekly_pick(uuid, text, text, integer, text, text, double precision, double precision)
  to authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 9) Storage: dish-photos bucket + owner-scoped policies
-- ----------------------------------------------------------------------------
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


-- ----------------------------------------------------------------------------
-- 10) Ask PostgREST to reload the schema cache immediately
-- ----------------------------------------------------------------------------
notify pgrst, 'reload schema';
