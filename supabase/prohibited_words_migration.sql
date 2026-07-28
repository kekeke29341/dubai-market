-- ============================================================
-- Prohibited words list + server-side check function
-- ============================================================
CREATE TABLE IF NOT EXISTS prohibited_words (
  id      serial PRIMARY KEY,
  word    text NOT NULL UNIQUE,
  active  boolean NOT NULL DEFAULT true
);

ALTER TABLE prohibited_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage prohibited words" ON prohibited_words
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Prohibited words are public" ON prohibited_words FOR SELECT USING (true);

-- Seed a few common violations for UAE marketplace context
INSERT INTO prohibited_words (word) VALUES
  ('weapon'), ('drugs'), ('alcohol'), ('gambling'), ('counterfeit'),
  ('fake'), ('replica'), ('stolen'), ('illegal'), ('prohibited')
ON CONFLICT DO NOTHING;

-- Function: check if text contains a prohibited word
CREATE OR REPLACE FUNCTION contains_prohibited_word(p_text text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM prohibited_words
    WHERE active = true
      AND lower(p_text) LIKE '%' || lower(word) || '%'
  );
END;
$$;

-- Trigger: block item inserts/updates that contain prohibited words
CREATE OR REPLACE FUNCTION check_item_prohibited_words()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF contains_prohibited_word(NEW.title) OR contains_prohibited_word(coalesce(NEW.description, '')) THEN
    RAISE EXCEPTION 'Your listing contains prohibited content. Please review our community guidelines.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS item_prohibited_words_check ON items;
CREATE TRIGGER item_prohibited_words_check
  BEFORE INSERT OR UPDATE OF title, description ON items
  FOR EACH ROW EXECUTE FUNCTION check_item_prohibited_words();
