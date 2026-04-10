-- Raise chapter_num upper bound from 5 to 120 to support Basic (60) and Pro (120) plans
ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_chapter_num_check;
ALTER TABLE chapters ADD CONSTRAINT chapters_chapter_num_check
  CHECK (chapter_num BETWEEN 1 AND 120);
