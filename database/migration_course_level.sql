-- Migration: Add level field to courses table
-- Levels: BEGINNER, INTERMEDIATE, EXPERT

ALTER TABLE courses ADD COLUMN level VARCHAR(20) DEFAULT NULL;

-- Update existing courses to BEGINNER by default
UPDATE courses SET level = 'BEGINNER' WHERE level IS NULL;
