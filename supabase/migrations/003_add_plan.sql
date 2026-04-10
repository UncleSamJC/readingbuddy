-- Add plan field to user_settings
-- Only 'Free', 'Basic', 'Pro' are valid values; default is 'Free'
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'Free'
  CHECK (plan IN ('Free', 'Basic', 'Pro'));
