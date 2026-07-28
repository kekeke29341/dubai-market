-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- PROFILES (extends auth.users)
-- =====================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  location text default 'Dubai, UAE',
  rating numeric(3,2) default 0,
  reviews_count integer default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- =====================
-- CATEGORIES
-- =====================
create table public.categories (
  id serial primary key,
  name text not null,
  slug text unique not null,
  icon text,
  created_at timestamptz default now()
);

insert into public.categories (name, slug, icon) values
  ('Electronics', 'electronics', '📱'),
  ('Fashion', 'fashion', '👗'),
  ('Home & Garden', 'home-garden', '🏡'),
  ('Sports', 'sports', '⚽'),
  ('Vehicles', 'vehicles', '🚗'),
  ('Books', 'books', '📚'),
  ('Toys & Kids', 'toys-kids', '🧸'),
  ('Art & Collectibles', 'art', '🎨'),
  ('Health & Beauty', 'health-beauty', '💄'),
  ('Other', 'other', '📦');

-- =====================
-- ITEMS
-- =====================
create type item_condition as enum ('new', 'like_new', 'good', 'fair', 'poor');
create type item_status as enum ('active', 'sold', 'reserved', 'deleted');

create table public.items (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  category_id integer references public.categories(id),
  title text not null,
  description text,
  price numeric(10,2) not null,
  currency text default 'AED',
  condition item_condition not null,
  status item_status default 'active',
  images text[] default '{}',
  location text default 'Dubai, UAE',
  views_count integer default 0,
  favorites_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.items enable row level security;

create policy "Items are viewable by everyone"
  on public.items for select using (status != 'deleted');

create policy "Authenticated users can create items"
  on public.items for insert with check (auth.uid() = seller_id);

create policy "Sellers can update their own items"
  on public.items for update using (auth.uid() = seller_id);

create policy "Sellers can delete their own items"
  on public.items for delete using (auth.uid() = seller_id);

-- =====================
-- FAVORITES
-- =====================
create table public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_id uuid references public.items(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, item_id)
);

alter table public.favorites enable row level security;

create policy "Users can view their own favorites"
  on public.favorites for select using (auth.uid() = user_id);

create policy "Users can add favorites"
  on public.favorites for insert with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
  on public.favorites for delete using (auth.uid() = user_id);

-- =====================
-- CONVERSATIONS
-- =====================
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.items(id) on delete cascade not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  last_message text,
  last_message_at timestamptz default now(),
  buyer_unread_count integer default 0,
  seller_unread_count integer default 0,
  created_at timestamptz default now(),
  unique(item_id, buyer_id)
);

alter table public.conversations enable row level security;

create policy "Conversation participants can view"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Buyers can create conversations"
  on public.conversations for insert with check (auth.uid() = buyer_id);

create policy "Participants can update conversations"
  on public.conversations for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- =====================
-- MESSAGES
-- =====================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Conversation participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- =====================
-- FUNCTIONS & TRIGGERS
-- =====================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update item updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger items_updated_at
  before update on public.items
  for each row execute procedure public.handle_updated_at();

-- Update favorites count
create or replace function public.update_favorites_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.items set favorites_count = favorites_count + 1 where id = new.item_id;
  elsif (TG_OP = 'DELETE') then
    update public.items set favorites_count = favorites_count - 1 where id = old.item_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_favorite_changed
  after insert or delete on public.favorites
  for each row execute procedure public.update_favorites_count();

-- =====================
-- STORAGE BUCKETS
-- =====================
insert into storage.buckets (id, name, public) values ('item-images', 'item-images', true);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "Anyone can view item images"
  on storage.objects for select using (bucket_id = 'item-images');

create policy "Authenticated users can upload item images"
  on storage.objects for insert
  with check (bucket_id = 'item-images' and auth.role() = 'authenticated');

create policy "Users can update their item images"
  on storage.objects for update
  using (bucket_id = 'item-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their item images"
  on storage.objects for delete
  using (bucket_id = 'item-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view avatars"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload their avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for messages and conversations
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
