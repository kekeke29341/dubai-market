-- ============================================================
-- Dubai Market — production migrations (run once in SQL Editor)
-- Project: https://supabase.com/dashboard/project/hsqdkmlynamezsqgvwyt/sql
-- Order: bugfix → search/brand → drafts/price → follows/notifications
--        → reports → reviews/offers
-- ============================================================

-- ---------- bugfix_patch ----------
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

create or replace function public.increment_views(item_id uuid)
returns void as $$
  update public.items
  set views_count = views_count + 1
  where id = item_id;
$$ language sql security definer;

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

-- ---------- search / brand / history ----------
ALTER TABLE items ADD COLUMN IF NOT EXISTS brand text;

DO $$ BEGIN
  ALTER TABLE items ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(brand, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(location, '')), 'D')
    ) STORED;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS items_search_vector_idx ON items USING gin(search_vector);

CREATE TABLE IF NOT EXISTS tags (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tags are public" ON tags;
CREATE POLICY "Tags are public" ON tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Item tags are public" ON item_tags;
CREATE POLICY "Item tags are public" ON item_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Sellers manage own item tags" ON item_tags;
CREATE POLICY "Sellers manage own item tags" ON item_tags
  FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM items WHERE id = item_id AND seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM items WHERE id = item_id AND seller_id = auth.uid()));

CREATE TABLE IF NOT EXISTS view_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id    uuid NOT NULL REFERENCES items(id)    ON DELETE CASCADE,
  viewed_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS view_history_user_idx ON view_history(user_id, viewed_at DESC);
ALTER TABLE view_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own history" ON view_history;
CREATE POLICY "Users manage own history" ON view_history
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION upsert_view_history(p_user_id uuid, p_item_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO view_history (user_id, item_id, viewed_at)
  VALUES (p_user_id, p_item_id, now())
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET viewed_at = now();
END;
$$;

-- ---------- drafts / price drop ----------
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_status_check;
ALTER TABLE items ADD CONSTRAINT items_status_check
  CHECK (status IN ('active', 'reserved', 'sold', 'deleted', 'draft'));

ALTER TABLE items ADD COLUMN IF NOT EXISTS original_price numeric;
ALTER TABLE items ADD COLUMN IF NOT EXISTS price_dropped_at timestamptz;

CREATE OR REPLACE FUNCTION drop_item_price(p_item_id uuid, p_new_price numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_seller uuid;
BEGIN
  SELECT seller_id INTO v_seller FROM items WHERE id = p_item_id;
  IF v_seller IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE items
  SET
    original_price   = CASE WHEN original_price IS NULL THEN price ELSE original_price END,
    price            = p_new_price,
    price_dropped_at = now()
  WHERE id = p_item_id
    AND price > p_new_price;
END;
$$;

-- ---------- follows / blocks / notifications ----------
CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own follows" ON follows;
CREATE POLICY "Users manage own follows" ON follows
  FOR ALL TO authenticated
  USING  (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());
DROP POLICY IF EXISTS "Follows are public" ON follows;
CREATE POLICY "Follows are public" ON follows FOR SELECT USING (true);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION handle_follow_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_change ON follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow_change();

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own blocks" ON blocks;
CREATE POLICY "Users manage own blocks" ON blocks
  FOR ALL TO authenticated
  USING  (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());
DROP POLICY IF EXISTS "Blocks are private" ON blocks;
CREATE POLICY "Blocks are private" ON blocks
  FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('price_drop', 'new_listing', 'new_follower', 'item_sold')),
  title       text NOT NULL,
  body        text,
  item_id     uuid REFERENCES items(id) ON DELETE CASCADE,
  actor_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications(user_id, read) WHERE read = false;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION notify_price_drop()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.price < OLD.price THEN
    INSERT INTO notifications (user_id, type, title, body, item_id, actor_id)
    SELECT
      f.user_id,
      'price_drop',
      'Price drop on ' || NEW.title,
      'Now ' || NEW.currency || ' ' || NEW.price::text || ' (was ' || OLD.price::text || ')',
      NEW.id,
      NEW.seller_id
    FROM favorites f
    WHERE f.item_id = NEW.id
      AND f.user_id <> NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_price_drop ON items;
CREATE TRIGGER on_price_drop
  AFTER UPDATE OF price ON items
  FOR EACH ROW EXECUTE FUNCTION notify_price_drop();

CREATE OR REPLACE FUNCTION notify_new_listing()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    INSERT INTO notifications (user_id, type, title, body, item_id, actor_id)
    SELECT
      f.follower_id,
      'new_listing',
      'New item from ' || p.username,
      NEW.title || ' — ' || NEW.currency || ' ' || NEW.price::text,
      NEW.id,
      NEW.seller_id
    FROM follows f
    JOIN profiles p ON p.id = NEW.seller_id
    WHERE f.following_id = NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_listing ON items;
CREATE TRIGGER on_new_listing
  AFTER INSERT OR UPDATE OF status ON items
  FOR EACH ROW EXECUTE FUNCTION notify_new_listing();

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_username text;
BEGIN
  SELECT username INTO v_username FROM profiles WHERE id = NEW.follower_id;
  INSERT INTO notifications (user_id, type, title, body, actor_id)
  VALUES (NEW.following_id, 'new_follower', v_username || ' started following you', NULL, NEW.follower_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_follower ON follows;
CREATE TRIGGER on_new_follower
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_new_follower();

-- ---------- reports ----------
CREATE TABLE IF NOT EXISTS reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason      text NOT NULL CHECK (reason IN ('spam', 'prohibited', 'fraud', 'inappropriate', 'duplicate', 'other')),
  details     text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, reporter_id)
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can report items" ON reports;
CREATE POLICY "Users can report items" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
