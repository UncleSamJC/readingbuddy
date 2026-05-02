-- Monthly AI chat usage tracking
CREATE TABLE IF NOT EXISTS chat_usage (
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT    NOT NULL,  -- e.g. '2026-04'
  count      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_chat_usage_user ON chat_usage (user_id, year_month);

-- Atomic increment: upsert + return new count
CREATE OR REPLACE FUNCTION increment_chat_usage(p_user_id UUID, p_year_month TEXT)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO chat_usage (user_id, year_month, count)
  VALUES (p_user_id, p_year_month, 1)
  ON CONFLICT (user_id, year_month)
  DO UPDATE SET count = chat_usage.count + 1
  RETURNING count;
$$;
