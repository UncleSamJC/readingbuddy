-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Books (owned by user)
CREATE TABLE IF NOT EXISTS books (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  author      TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters (max 5 per book, max 3000 words each)
CREATE TABLE IF NOT EXISTS chapters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     UUID REFERENCES books(id) ON DELETE CASCADE,
  title       TEXT,
  chapter_num INTEGER NOT NULL CHECK (chapter_num BETWEEN 1 AND 5),
  raw_text    TEXT NOT NULL,
  word_count  INTEGER GENERATED ALWAYS AS (
                array_length(string_to_array(trim(raw_text), ' '), 1)
              ) STORED,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Marked words (per user)
CREATE TABLE IF NOT EXISTS marked_words (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id       UUID REFERENCES books(id) ON DELETE CASCADE,
  word          TEXT NOT NULL,
  context       TEXT,
  chapter_title TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Reading progress (per user per chapter)
CREATE TABLE IF NOT EXISTS reading_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id      UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  last_paragraph  INTEGER DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- User settings (TTS voice, speed, etc.)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tts_voice   TEXT DEFAULT 'shimmer',
  tts_speed   NUMERIC(3,2) DEFAULT 0.85,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages (per user per book)
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id     UUID REFERENCES books(id) ON DELETE CASCADE,
  chapter_id  UUID REFERENCES chapters(id) ON DELETE SET NULL,
  role        TEXT CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_books_owner ON books (owner_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book ON chapters (book_id, chapter_num);
CREATE INDEX IF NOT EXISTS idx_marked_words_user ON marked_words (user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages (user_id, book_id, created_at);

-- RLS disabled for MVP (backend auth middleware handles access control)
-- Re-enable with proper policies when moving to production
