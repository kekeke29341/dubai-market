-- ============================================================
-- 1. Follows
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own follows" ON follows
  FOR ALL TO authenticated
  USING  (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Follows are public" ON follows FOR SELECT USING (true);

-- Follow/unfollow counts on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0;

-- Trigger: keep counts in sync
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

-- ============================================================
-- 2. Blocks
-- ============================================================
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own blocks" ON blocks
  FOR ALL TO authenticated
  USING  (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());
-- Blocks are private — only the blocker can see them
CREATE POLICY "Blocks are private" ON blocks
  FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());

-- Hide blocked users' items from the listing
-- (Applied in app layer by filtering seller_id NOT IN blocked list)

-- ============================================================
-- 3. Notifications
-- ============================================================
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
CREATE POLICY "Users manage own notifications" ON notifications
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 4. Trigger: price drop → notify favoriting users
-- ============================================================
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

-- ============================================================
-- 5. Trigger: new listing → notify followers
-- ============================================================
CREATE OR REPLACE FUNCTION notify_new_listing()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status <> 'active') THEN
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

-- ============================================================
-- 6. Trigger: new follower → notify followed user
-- ============================================================
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
