-- Migration: Make trainer_id nullable on training_plans
-- Trainers can now be assigned after plan creation
ALTER TABLE training_plans MODIFY COLUMN trainer_id INT NULL;
