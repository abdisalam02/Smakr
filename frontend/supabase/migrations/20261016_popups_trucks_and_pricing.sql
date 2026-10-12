-- ============================================================================
-- Smakr — Pop-ups, Food Trucks, Pricing & Quick-Editing
-- ============================================================================
-- 1. Add spot_type, popup dates, and schedule to public.venues
-- 2. Add publication and archive flags to public.food_posts
-- 3. Ensure food_posts.price_nok is nullable
-- ============================================================================

-- Venues extensions
alter table public.venues
  add column if not exists spot_type text default 'restaurant',
  add column if not exists popup_start_date timestamptz,
  add column if not exists popup_end_date timestamptz,
  add column if not exists location_schedule text,
  add column if not exists website_uri text,
  add column if not exists google_maps_uri text,
  add column if not exists phone_number text;

-- Food posts extensions
alter table public.food_posts
  alter column price_nok drop not null,
  add column if not exists category text,
  add column if not exists is_published boolean default true,
  add column if not exists is_archived boolean default false;

notify pgrst, 'reload schema';
