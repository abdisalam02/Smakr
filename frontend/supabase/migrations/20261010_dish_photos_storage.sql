-- ============================================================================
-- Smakr — community dish photo uploads (Supabase Storage)
-- ============================================================================
-- Run in Supabase Dashboard → SQL Editor (or `supabase db push`).
--
-- Creates the public `dish-photos` bucket used by the "Log a Dish" modal and
-- the policies that let signed-in foodies upload into their own folder
-- (`<auth.uid()>/<timestamp>.<ext>`). Reads are public so the feed can render
-- the images directly.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) The bucket (public read, 5 MB limit, images only)
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

-- ---------------------------------------------------------------------------
-- 2) Policies on storage.objects
-- ---------------------------------------------------------------------------
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
