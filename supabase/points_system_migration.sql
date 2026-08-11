-- ============================================================
-- Points System
-- Views → Points conversion for creators
-- ============================================================

-- 1. Points balance on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points_balance integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points_earned integer NOT NULL DEFAULT 0;

-- 2. Points ledger (audit trail of every points event)
CREATE TABLE IF NOT EXISTS points_ledger (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id     uuid REFERENCES items(id) ON DELETE SET NULL,
  delta       integer NOT NULL,         -- positive = earned, negative = redeemed
  reason      text NOT NULL CHECK (reason IN ('views_milestone', 'redemption', 'bonus', 'adjustment')),
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS points_ledger_user_idx ON points_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS points_ledger_item_idx ON points_ledger(item_id);

ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ledger" ON points_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System inserts ledger" ON points_ledger
  FOR INSERT WITH CHECK (true);

-- 3. View milestones tracker (prevents double-awarding points for same milestone)
CREATE TABLE IF NOT EXISTS view_milestones (
  item_id     uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  milestone   integer NOT NULL,   -- e.g. 10, 50, 100, 500 …
  awarded_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, milestone)
);

ALTER TABLE view_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View milestones are public" ON view_milestones FOR SELECT USING (true);

-- 4. Points conversion rules (how many views = how many points)
-- 10 views  = 1 pt, 50 views = 5 pts, 100 = 15 pts, 500 = 80 pts, 1000 = 200 pts
CREATE OR REPLACE FUNCTION get_milestone_points(p_milestone integer)
RETURNS integer LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN CASE p_milestone
    WHEN 10   THEN 1
    WHEN 50   THEN 5
    WHEN 100  THEN 15
    WHEN 500  THEN 80
    WHEN 1000 THEN 200
    WHEN 5000 THEN 1200
    ELSE 0
  END;
END;
$$;

-- 5. Award points when a view milestone is crossed
CREATE OR REPLACE FUNCTION check_and_award_view_milestones()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_milestones integer[] := ARRAY[10, 50, 100, 500, 1000, 5000];
  v_milestone  integer;
  v_pts        integer;
BEGIN
  FOREACH v_milestone IN ARRAY v_milestones LOOP
    -- Only if views just crossed this milestone
    IF NEW.views_count >= v_milestone AND OLD.views_count < v_milestone THEN
      -- Upsert: skip if already awarded (idempotent)
      INSERT INTO view_milestones (item_id, milestone)
      VALUES (NEW.id, v_milestone)
      ON CONFLICT DO NOTHING;

      IF FOUND THEN
        v_pts := get_milestone_points(v_milestone);
        IF v_pts > 0 THEN
          -- Update balance
          UPDATE profiles
          SET points_balance      = points_balance + v_pts,
              total_points_earned = total_points_earned + v_pts
          WHERE id = NEW.seller_id;

          -- Log it
          INSERT INTO points_ledger (user_id, item_id, delta, reason, description)
          VALUES (
            NEW.seller_id,
            NEW.id,
            v_pts,
            'views_milestone',
            NEW.title || ' reached ' || v_milestone || ' views'
          );

          -- Notify creator
          INSERT INTO notifications (user_id, type, title, body, item_id)
          VALUES (
            NEW.seller_id,
            'points_earned',
            'You earned ' || v_pts || ' point' || CASE WHEN v_pts = 1 THEN '' ELSE 's' END || '!',
            '"' || NEW.title || '" reached ' || v_milestone || ' views',
            NEW.id
          );
        END IF;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_views_milestone ON items;
CREATE TRIGGER on_views_milestone
  AFTER UPDATE OF views_count ON items
  FOR EACH ROW EXECUTE FUNCTION check_and_award_view_milestones();

-- 6. Notification type: add points_earned
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('price_drop', 'new_listing', 'new_follower', 'item_sold', 'points_earned'));

-- 7. RPC: leaderboard by total views (top 50 creators)
CREATE OR REPLACE FUNCTION get_creator_leaderboard(p_limit integer DEFAULT 50)
RETURNS TABLE (
  rank            bigint,
  user_id         uuid,
  username        text,
  avatar_url      text,
  total_views     bigint,
  total_items     bigint,
  points_balance  integer,
  total_points_earned integer
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY SUM(i.views_count) DESC) AS rank,
    p.id                        AS user_id,
    p.username,
    p.avatar_url,
    SUM(i.views_count)::bigint  AS total_views,
    COUNT(i.id)::bigint         AS total_items,
    p.points_balance,
    p.total_points_earned
  FROM profiles p
  JOIN items i ON i.seller_id = p.id AND i.status IN ('active', 'sold')
  GROUP BY p.id, p.username, p.avatar_url, p.points_balance, p.total_points_earned
  ORDER BY total_views DESC
  LIMIT p_limit;
$$;

-- 8. RPC: creator stats for a single user
CREATE OR REPLACE FUNCTION get_creator_stats(p_user_id uuid)
RETURNS TABLE (
  item_id         uuid,
  title           text,
  images          text[],
  status          text,
  views_count     integer,
  favorites_count integer,
  points_earned   integer,
  created_at      timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    i.id            AS item_id,
    i.title,
    i.images,
    i.status::text,
    i.views_count,
    i.favorites_count,
    COALESCE(SUM(pl.delta), 0)::integer AS points_earned,
    i.created_at
  FROM items i
  LEFT JOIN points_ledger pl ON pl.item_id = i.id AND pl.user_id = p_user_id AND pl.delta > 0
  WHERE i.seller_id = p_user_id
    AND i.status != 'deleted'
  GROUP BY i.id, i.title, i.images, i.status, i.views_count, i.favorites_count, i.created_at
  ORDER BY i.views_count DESC;
$$;
