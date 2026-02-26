-- Migration: Add student_id to training_plans table
-- Each training plan is individual per student (1 student per plan)

-- Add student_id column to training_plans
ALTER TABLE training_plans 
ADD COLUMN student_id INT NULL,
ADD CONSTRAINT fk_training_plans_student 
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL;

-- Migrate existing data: copy first assignment user_id to student_id
UPDATE training_plans tp
SET student_id = (
    SELECT user_id 
    FROM training_plan_assignments tpa 
    WHERE tpa.training_plan_id = tp.id 
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM training_plan_assignments tpa 
    WHERE tpa.training_plan_id = tp.id
);

-- Optional: Remove duplicate assignments (keep only first per plan)
-- DELETE tpa1 FROM training_plan_assignments tpa1
-- INNER JOIN training_plan_assignments tpa2
-- WHERE tpa1.id > tpa2.id 
-- AND tpa1.training_plan_id = tpa2.training_plan_id;

-- Show result
SELECT id, title, student_id FROM training_plans;
