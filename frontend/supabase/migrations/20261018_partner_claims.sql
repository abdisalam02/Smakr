-- ---------------------------------------------------------------------------
-- Migration: 20261018_partner_claims.sql
-- Description: Partner claims table for Smakr Partner (/partner) review queue.
-- ---------------------------------------------------------------------------

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

-- Index for admin queue queries
create index if not exists idx_partner_claims_status_created
  on public.partner_claims (status, created_at desc);

-- Partial unique index: at most 1 pending claim per venue per applicant email
create unique index if not exists idx_partner_claims_pending_venue_email
  on public.partner_claims (venue_id, lower(applicant_email))
  where status = 'pending';

-- Enable Row Level Security (RLS)
alter table public.partner_claims enable row level security;

-- Strictly admin-only read policy
drop policy if exists "partner_claims_admin_select" on public.partner_claims;
create policy "partner_claims_admin_select"
  on public.partner_claims for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Strictly admin-only update policy
drop policy if exists "partner_claims_admin_update" on public.partner_claims;
create policy "partner_claims_admin_update"
  on public.partner_claims for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
