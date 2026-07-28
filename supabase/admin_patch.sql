-- =====================
-- ADMIN PATCH
-- Run this after schema.sql
-- =====================

-- Add is_admin flag to profiles
alter table public.profiles add column if not exists is_admin boolean default false;

-- Add ban/suspend flags
alter table public.profiles add column if not exists is_banned boolean default false;
alter table public.profiles add column if not exists ban_reason text;

-- Add admin_note to items
alter table public.items add column if not exists admin_note text;
alter table public.items add column if not exists is_flagged boolean default false;

-- Profiles are already public via schema.sql "Profiles are viewable by everyone" policy.
-- No additional SELECT policy needed here.

-- Helper function: check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  )
$$ language sql security definer stable;

-- Admins can update any item (for moderation)
create policy "Admins can update any item"
  on public.items for update
  using (public.is_admin() = true);

-- Admins can update any profile (for ban etc.)
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin() = true);

-- To make yourself admin (run once with your user UUID):
-- update public.profiles set is_admin = true where id = 'YOUR-USER-UUID';
