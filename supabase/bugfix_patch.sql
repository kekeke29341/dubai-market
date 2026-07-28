-- =====================
-- BUG FIX PATCH
-- Run after schema.sql + admin_patch.sql
-- =====================

-- Fix 1: handle_new_user stores '' instead of NULL for optional fields
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Fix 2: favorites_count can go negative on DELETE
create or replace function public.update_favorites_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.items set favorites_count = favorites_count + 1 where id = new.item_id;
  elsif (TG_OP = 'DELETE') then
    update public.items set favorites_count = greatest(0, favorites_count - 1) where id = old.item_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Fix 3: Atomic view count increment (avoids read-modify-write race)
create or replace function public.increment_views(item_id uuid)
returns void as $$
  update public.items
  set views_count = views_count + 1
  where id = item_id;
$$ language sql security definer;

-- Fix 4: Atomic unread count increment for messages
create or replace function public.increment_unread(conv_id uuid, column_name text)
returns void as $$
begin
  if column_name = 'buyer_unread_count' then
    update public.conversations
    set buyer_unread_count = buyer_unread_count + 1
    where id = conv_id;
  elsif column_name = 'seller_unread_count' then
    update public.conversations
    set seller_unread_count = seller_unread_count + 1
    where id = conv_id;
  end if;
end;
$$ language plpgsql security definer;
