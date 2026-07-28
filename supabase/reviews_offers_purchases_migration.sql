-- ============================================================
-- 1. Reviews (mutual, one per transaction direction)
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  reviewer_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating       smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  reply        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  replied_at   timestamptz,
  UNIQUE (item_id, reviewer_id)  -- one review per reviewer per item
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON reviews
  FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Reviewee can add reply" ON reviews
  FOR UPDATE TO authenticated
  USING (reviewee_id = auth.uid())
  WITH CHECK (reviewee_id = auth.uid());

-- Keep profiles.rating in sync
CREATE OR REPLACE FUNCTION refresh_profile_rating(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET
    rating        = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = p_user_id),
    reviews_count = (SELECT COUNT(*)    FROM reviews WHERE reviewee_id = p_user_id)
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION handle_review_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM refresh_profile_rating(NEW.reviewee_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM refresh_profile_rating(OLD.reviewee_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION handle_review_change();

-- ============================================================
-- 2. Purchases (lightweight — marks a transaction)
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  buyer_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount      numeric NOT NULL,
  currency    text NOT NULL DEFAULT 'AED',
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id)  -- one purchase per item
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view own purchases" ON purchases
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "Buyer can create purchase" ON purchases
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Seller can update status" ON purchases
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid());

-- RPC: confirm purchase — marks item as sold, creates purchase row
CREATE OR REPLACE FUNCTION confirm_purchase(p_item_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item  items%ROWTYPE;
  v_id    uuid;
BEGIN
  SELECT * INTO v_item FROM items WHERE id = p_item_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not available'; END IF;
  IF v_item.seller_id = auth.uid() THEN RAISE EXCEPTION 'Cannot buy own item'; END IF;

  INSERT INTO purchases (item_id, buyer_id, seller_id, amount, currency, status)
  VALUES (p_item_id, auth.uid(), v_item.seller_id, v_item.price, v_item.currency, 'completed')
  RETURNING id INTO v_id;

  UPDATE items SET status = 'sold' WHERE id = p_item_id;
  RETURN v_id;
END;
$$;

-- ============================================================
-- 3. Offers / Price negotiation
-- ============================================================
CREATE TABLE IF NOT EXISTS offers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  buyer_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount       numeric NOT NULL,
  currency     text NOT NULL DEFAULT 'AED',
  message      text,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

CREATE INDEX IF NOT EXISTS offers_item_idx ON offers(item_id);
CREATE INDEX IF NOT EXISTS offers_buyer_idx ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS offers_seller_idx ON offers(seller_id);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view offers" ON offers
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "Buyer can create offer" ON offers
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Seller can respond to offer" ON offers
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid());

-- Notify seller on new offer
CREATE OR REPLACE FUNCTION notify_new_offer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_title text; v_username text;
BEGIN
  SELECT title INTO v_title FROM items WHERE id = NEW.item_id;
  SELECT username INTO v_username FROM profiles WHERE id = NEW.buyer_id;
  INSERT INTO notifications (user_id, type, title, body, item_id, actor_id)
  VALUES (
    NEW.seller_id, 'price_drop',
    v_username || ' made an offer on ' || v_title,
    NEW.currency || ' ' || NEW.amount::text,
    NEW.item_id, NEW.buyer_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_offer ON offers;
CREATE TRIGGER on_new_offer
  AFTER INSERT ON offers
  FOR EACH ROW EXECUTE FUNCTION notify_new_offer();
