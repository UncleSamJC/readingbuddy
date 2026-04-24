-- Rename plan 'Basic' to 'Plus'
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_plan_check;

UPDATE user_settings SET plan = 'Plus' WHERE plan = 'Basic';

ALTER TABLE user_settings
  ADD CONSTRAINT user_settings_plan_check
  CHECK (plan IN ('Free', 'Plus', 'Pro'));


--NOTE: DONE 