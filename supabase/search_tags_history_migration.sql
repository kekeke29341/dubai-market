-- ============================================================
-- 1. Full-text search index on items
-- ============================================================
ALTER TABLE items ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS items_search_vector_idx ON items USING gin(search_vector);

-- ============================================================
-- 2. Brand column on items (if not already present)
-- ============================================================
ALTER TABLE items ADD COLUMN IF NOT EXISTS brand text;

-- ============================================================
-- 3. Tags (many-to-many via item_tags join table)
-- ============================================================
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

CREATE POLICY "Tags are public" ON tags FOR SELECT USING (true);
CREATE POLICY "Item tags are public" ON item_tags FOR SELECT USING (true);
CREATE POLICY "Sellers manage own item tags" ON item_tags
  FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM items WHERE id = item_id AND seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM items WHERE id = item_id AND seller_id = auth.uid()));

-- ============================================================
-- 4. View history
-- ============================================================
CREATE TABLE IF NOT EXISTS view_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id    uuid NOT NULL REFERENCES items(id)    ON DELETE CASCADE,
  viewed_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)  -- upsert keeps one row per user/item
);

CREATE INDEX IF NOT EXISTS view_history_user_idx ON view_history(user_id, viewed_at DESC);

ALTER TABLE view_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own history" ON view_history
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RPC: upsert a view_history row (called fire-and-forget from item detail page)
CREATE OR REPLACE FUNCTION upsert_view_history(p_user_id uuid, p_item_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO view_history (user_id, item_id, viewed_at)
  VALUES (p_user_id, p_item_id, now())
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET viewed_at = now();
END;
$$;
