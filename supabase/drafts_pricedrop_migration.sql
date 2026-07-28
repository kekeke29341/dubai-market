-- ============================================================
-- 1. Draft support on items (status = 'draft' already possible
--    if the CHECK constraint allows it — add it if needed)
-- ============================================================
-- Assuming items.status CHECK is: active | reserved | sold | deleted
-- We add 'draft' to the allowed values.
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_status_check;
ALTER TABLE items ADD CONSTRAINT items_status_check
  CHECK (status IN ('active', 'reserved', 'sold', 'deleted', 'draft'));

-- ============================================================
-- 2. Price drop tracking
-- ============================================================
ALTER TABLE items ADD COLUMN IF NOT EXISTS original_price numeric;
ALTER TABLE items ADD COLUMN IF NOT EXISTS price_dropped_at timestamptz;

-- RPC: drop the price atomically and record the original
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
    AND price > p_new_price;  -- only accept an actual reduction
END;
$$;
