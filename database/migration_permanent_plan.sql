-- Migration: Add is_permanent field to training_plans table
-- Permanent plans auto-set end_date to 31/12 of current year and update yearly

ALTER TABLE training_plans ADD COLUMN is_permanent TINYINT(1) DEFAULT 0;

-- Update existing plans: not permanent by default
UPDATE training_plans SET is_permanent = 0 WHERE is_permanent IS NULL;
