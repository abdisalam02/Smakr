-- ============================================================================
-- Smakr — admin write policies (Google Places importer, moderation, cleanup)
-- ============================================================================
-- Run in Supabase Dashboard → SQL Editor (or `supabase db push`).
--
-- Without these, the importer's `insert into venues/food_posts` is rejected by
-- RLS (error 42501). Admins are identified via public.profiles.role = 'admin'.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- venues — admins can insert / update / delete
-- ---------------------------------------------------------------------------
drop policy if exists "venues_admin_insert" on public.venues;
create policy "venues_admin_insert"
  on public.venues for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "venues_admin_update" on public.venues;
create policy "venues_admin_update"
  on public.venues for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "venues_admin_delete" on public.venues;
create policy "venues_admin_delete"
  on public.venues for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---------------------------------------------------------------------------
-- food_posts — admins manage everything; foodies post/like/save as themselves
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- post_likes / post_saves — a user may write only their own reactions
-- ---------------------------------------------------------------------------
drop policy if exists "post_likes_own_insert" on public.post_likes;
create policy "post_likes_own_insert"
  on public.post_likes for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "post_likes_own_delete" on public.post_likes;
create policy "post_likes_own_delete"
  on public.post_likes for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "post_saves_own_insert" on public.post_saves;
create policy "post_saves_own_insert"
  on public.post_saves for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "post_saves_own_delete" on public.post_saves;
create policy "post_saves_own_delete"
  on public.post_saves for delete to authenticated
  using (user_id = auth.uid());

notify pgrst, 'reload schema';
