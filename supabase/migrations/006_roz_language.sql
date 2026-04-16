-- Add Roz response language preference to user settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS roz_language TEXT NOT NULL DEFAULT 'English';
