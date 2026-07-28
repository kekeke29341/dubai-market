-- =====================
-- SEED DATA for Development / Testing
-- Run after schema.sql + admin_patch.sql + bugfix_patch.sql
--
-- Creates:
--   3 users (alice = admin, bob = seller, carol = buyer)
--   20 items across categories
--   3 favorites
--   1 conversation + 3 messages
-- =====================

-- NOTE: In production, users are created via auth.users (Supabase Auth).
-- For local dev, insert test profiles directly (bypassing auth.users FK) only if
-- auth.users rows exist OR foreign key is deferred. With Supabase local dev,
-- create users via the dashboard/API and then run the item/data section below.
--
-- To create test auth users locally:
--   supabase auth create-user --email alice@test.com --password password123
-- Then fill in their UUIDs below.

-- =====================
-- REPLACE THESE WITH YOUR LOCAL USER UUIDs
-- =====================
\set alice_id 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\set bob_id   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
\set carol_id 'cccccccc-cccc-cccc-cccc-cccccccccccc'

-- =====================
-- PROFILES
-- =====================
insert into public.profiles (id, username, full_name, avatar_url, bio, location, rating, reviews_count)
values
  (:'alice_id', 'alice_dubai', 'Alice Al Mansoori', null, 'Power seller in Dubai Marina. Electronics specialist.', 'Dubai Marina', 4.9, 47),
  (:'bob_id',   'bob_trades',  'Bob Ibrahim',        null, 'Selling quality pre-owned items. Fast shipping!', 'JBR, Dubai', 4.6, 23),
  (:'carol_id', 'carol_jbr',   'Carol Smith',        null, null, 'Downtown Dubai', 0, 0)
on conflict (id) do update set
  username     = excluded.username,
  full_name    = excluded.full_name,
  bio          = excluded.bio,
  location     = excluded.location,
  rating       = excluded.rating,
  reviews_count = excluded.reviews_count;

-- Make alice an admin
update public.profiles set is_admin = true where id = :'alice_id';

-- =====================
-- ITEMS — Electronics
-- =====================
insert into public.items (id, seller_id, category_id, title, description, price, currency, condition, status, images, location, views_count, favorites_count)
values
  (
    'item-e001', :'alice_id', 1,
    'iPhone 14 Pro 256GB Space Black',
    'Purchased from Apple Store Dubai. Always kept in case, no scratches. Comes with original box, charger, and 2 spare cases.',
    3200, 'AED', 'like_new', 'active',
    array[]::text[],
    'Dubai Marina', 89, 12
  ),
  (
    'item-e002', :'alice_id', 1,
    'MacBook Pro M2 14-inch 512GB',
    'Used for 6 months for light office work. Battery at 97% health. All accessories included.',
    7500, 'AED', 'like_new', 'active',
    array[]::text[],
    'Dubai Marina', 134, 21
  ),
  (
    'item-e003', :'bob_id', 1,
    'Samsung Galaxy S23 Ultra 256GB',
    'Dual SIM, unlocked. Minor scuffs on back, screen is perfect. Includes original charger.',
    2800, 'AED', 'good', 'active',
    array[]::text[],
    'JBR, Dubai', 67, 8
  ),
  (
    'item-e004', :'bob_id', 1,
    'Sony PlayStation 5 Disc Edition',
    'Bought at launch. Comes with 2 controllers and 3 games (FIFA 24, Spider-Man 2, God of War).',
    1800, 'AED', 'good', 'active',
    array[]::text[],
    'JBR, Dubai', 211, 34
  ),
  (
    'item-e005', :'alice_id', 1,
    'Apple AirPods Pro 2nd Generation',
    'Sealed box, bought as a gift but already have one. Official Apple warranty valid.',
    550, 'AED', 'new', 'active',
    array[]::text[],
    'Dubai Marina', 43, 6
  ),

-- =====================
-- ITEMS — Fashion
-- =====================
  (
    'item-f001', :'alice_id', 2,
    'Gucci GG Canvas Tote Bag',
    'Authentic, purchased from Gucci Dubai Mall. Comes with dust bag and receipt. Light signs of use.',
    3800, 'AED', 'good', 'active',
    array[]::text[],
    'Dubai Marina', 56, 9
  ),
  (
    'item-f002', :'bob_id', 2,
    'Nike Air Jordan 1 Retro High OG UK 10',
    'DS (deadstock), never worn. 100% authentic with original box.',
    1200, 'AED', 'new', 'active',
    array[]::text[],
    'JBR, Dubai', 88, 15
  ),

-- =====================
-- ITEMS — Home & Garden
-- =====================
  (
    'item-h001', :'bob_id', 3,
    'IKEA KALLAX Shelf Unit 4x4 White',
    'Disassembled and ready to pick up. All hardware included. No damage.',
    280, 'AED', 'good', 'active',
    array[]::text[],
    'Jumeirah, Dubai', 31, 4
  ),
  (
    'item-h002', :'alice_id', 3,
    'Nespresso Vertuo Plus Coffee Machine',
    'Used for 1 year, descaled regularly. Selling because upgrading. Includes 2 welcome packs.',
    350, 'AED', 'good', 'active',
    array[]::text[],
    'Dubai Marina', 29, 3
  ),

-- =====================
-- ITEMS — Vehicles
-- =====================
  (
    'item-v001', :'bob_id', 5,
    'Yamaha MT-07 2022 — 8,500km',
    'ABS, TCS, quick shifter. Serviced at Yamaha Dubai. No accidents. Selling because relocating.',
    28000, 'AED', 'like_new', 'active',
    array[]::text[],
    'Al Quoz, Dubai', 412, 67
  ),

-- =====================
-- ITEMS — Sports
-- =====================
  (
    'item-s001', :'alice_id', 4,
    'Peloton Bike+ (Latest Gen)',
    'Used for 6 months, excellent condition. Original cleats and resistance bands included.',
    4500, 'AED', 'like_new', 'active',
    array[]::text[],
    'Dubai Marina', 73, 11
  ),
  (
    'item-s002', :'bob_id', 4,
    'Callaway Rogue ST Max Driver',
    'Played 10 rounds. Headcover included. 9.5° loft, stiff shaft.',
    800, 'AED', 'good', 'active',
    array[]::text[],
    'Dubai Hills, Dubai', 22, 2
  ),

-- =====================
-- ITEMS — Books
-- =====================
  (
    'item-b001', :'alice_id', 6,
    'The Lean Startup + Zero to One + Shoe Dog (Bundle)',
    'All three business classics in great condition. Some highlighting in Lean Startup.',
    120, 'AED', 'good', 'active',
    array[]::text[],
    'Downtown Dubai', 18, 1
  ),

-- =====================
-- ITEMS — SOLD examples
-- =====================
  (
    'item-sold1', :'alice_id', 1,
    'iPad Pro 12.9" M2 WiFi 256GB',
    'Sold with Apple Pencil and Magic Keyboard Folio.',
    4200, 'AED', 'like_new', 'sold',
    array[]::text[],
    'Dubai Marina', 290, 28
  ),
  (
    'item-sold2', :'bob_id', 5,
    'Trek FX 3 Disc Hybrid Bike 2022',
    'Size M, hydraulic disc brakes. Lights and mudguards included.',
    2200, 'AED', 'good', 'sold',
    array[]::text[],
    'JBR, Dubai', 178, 19
  ),

-- =====================
-- ITEMS — Reserved
-- =====================
  (
    'item-res1', :'alice_id', 1,
    'DJI Mini 3 Pro Drone + Fly More Kit',
    'Flown ~10 hours. ND filter set included. Buyer confirmed, pending pickup.',
    3100, 'AED', 'like_new', 'reserved',
    array[]::text[],
    'Dubai Marina', 67, 14
  )
;

-- =====================
-- FAVORITES
-- =====================
insert into public.favorites (user_id, item_id)
values
  (:'carol_id', 'item-e001'),
  (:'carol_id', 'item-e004'),
  (:'carol_id', 'item-v001')
on conflict (user_id, item_id) do nothing;

-- =====================
-- CONVERSATION + MESSAGES
-- carol asks about the PS5
-- =====================
insert into public.conversations (id, item_id, buyer_id, seller_id, last_message, last_message_at, buyer_unread_count, seller_unread_count)
values (
  'conv-0001',
  'item-e004',
  :'carol_id',
  :'bob_id',
  'Is it still available?',
  now() - interval '1 hour',
  0,
  1
) on conflict (item_id, buyer_id) do nothing;

insert into public.messages (conversation_id, sender_id, content, is_read, created_at)
values
  ('conv-0001', :'carol_id', 'Hi! Is the PS5 still available?',          false, now() - interval '2 hours'),
  ('conv-0001', :'bob_id',   'Yes it is! Are you available this weekend?', true,  now() - interval '90 minutes'),
  ('conv-0001', :'carol_id', 'Is it still available?',                   false, now() - interval '1 hour')
on conflict do nothing;

-- =====================
-- Verify seed counts
-- =====================
do $$
declare
  profile_count int;
  item_count int;
  fav_count int;
begin
  select count(*) into profile_count from public.profiles where id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc'
  );
  select count(*) into item_count from public.items;
  select count(*) into fav_count from public.favorites;

  raise notice 'Seed complete: % profiles, % items, % favorites', profile_count, item_count, fav_count;
end;
$$;
