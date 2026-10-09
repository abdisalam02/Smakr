-- ============================================================================
-- Smakr — food category on public.food_posts
-- ============================================================================
-- Adds `category text` so dishes can have their own category (e.g. coffee, matcha)
-- distinct from the venue's overarching category.
--
-- Run in the Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Until applied, the app degrades gracefully: category is saved inside dietary_tags
-- with the cat_ prefix.
-- ============================================================================

alter table public.food_posts
  add column if not exists category text;

notify pgrst, 'reload schema';
