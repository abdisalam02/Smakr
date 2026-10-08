-- ============================================================================
-- Smakr — community venue inserts (from Google Places)
-- ============================================================================
-- Run in Supabase Dashboard → SQL Editor (or `supabase db push`).
--
-- The "Log a Dish" flow lets a signed-in foodie pick a brand-new spot from
-- Google Places, which must be inserted into public.venues before the dish FK
-- can be satisfied. The existing admin policy (20261008) already covers admins;
-- this adds a NARROW policy for regular users: they may only insert venues that
-- carry a Google Place ID (i.e. a real, verifiable place), which keeps the
-- table clean while unblocking the community flow.
--
-- The client degrades gracefully when this migration is absent: a permission
-- error surfaces a friendly "pick an existing spot" message.
-- ============================================================================

drop policy if exists "venues_community_insert" on public.venues;
create policy "venues_community_insert"
  on public.venues for insert to authenticated
  with check (
    google_place_id is not null
    and length(trim(name)) > 0
    and latitude is not null
    and longitude is not null
  );

notify pgrst, 'reload schema';
