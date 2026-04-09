-- Enable Row-Level Security on all tables
-- Note: backend uses service_role key which bypasses RLS — these policies
-- protect against direct client/anon access to the Supabase project URL.

ALTER TABLE books           ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters        ENABLE ROW LEVEL SECURITY;
ALTER TABLE marked_words    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages   ENABLE ROW LEVEL SECURITY;

-- ── books ──
CREATE POLICY "books: owner full access"
  ON books FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── chapters ──
-- Access allowed only if the user owns the parent book
CREATE POLICY "chapters: owner full access"
  ON chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = chapters.book_id
        AND books.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = chapters.book_id
        AND books.owner_id = auth.uid()
    )
  );

-- ── marked_words ──
CREATE POLICY "marked_words: owner full access"
  ON marked_words FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── reading_progress ──
CREATE POLICY "reading_progress: owner full access"
  ON reading_progress FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── user_settings ──
CREATE POLICY "user_settings: owner full access"
  ON user_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── chat_messages ──
CREATE POLICY "chat_messages: owner full access"
  ON chat_messages FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
