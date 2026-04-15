-- Audit log for deleted accounts (business record retention)
CREATE TABLE IF NOT EXISTS user_history_audit (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  email        TEXT,
  books_json   JSONB,          -- snapshot of books at deletion time
  deleted_at   TIMESTAMPTZ DEFAULT NOW()
);

-- No foreign key to auth.users — record must survive after user is deleted
CREATE INDEX IF NOT EXISTS idx_user_history_audit_deleted_at ON user_history_audit (deleted_at DESC);
