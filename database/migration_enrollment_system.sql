-- Migration: Training Plan Enrollment System
-- Plans become catalog templates, students are enrolled with individual dates/status
-- Date: 2025-01-XX

-- 1. Add enrollment fields to training_plan_assignments
ALTER TABLE training_plan_assignments 
    ADD COLUMN start_date DATETIME NULL AFTER assigned_at,
    ADD COLUMN end_date DATETIME NULL AFTER start_date,
    ADD COLUMN status VARCHAR(50) DEFAULT 'PENDING' AFTER end_date,
    ADD COLUMN progress_percentage FLOAT DEFAULT 0 AFTER status,
    ADD COLUMN notes TEXT NULL AFTER progress_percentage;

-- 2. Make student_id nullable on training_plans (plan becomes a template)
ALTER TABLE training_plans MODIFY COLUMN student_id INT NULL;

-- 3. Migrate existing student_id data to training_plan_assignments
-- For each plan that has a student_id but no matching assignment, create one
INSERT INTO training_plan_assignments (training_plan_id, user_id, assigned_by, assigned_at, start_date, end_date, status)
SELECT 
    tp.id, 
    tp.student_id, 
    tp.created_by,
    COALESCE(tp.created_at, NOW()),
    tp.start_date,
    tp.end_date,
    CASE 
        WHEN tp.completed_at IS NOT NULL THEN 'COMPLETED'
        WHEN tp.status = 'IN_PROGRESS' THEN 'IN_PROGRESS'
        ELSE 'PENDING'
    END
FROM training_plans tp
WHERE tp.student_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM training_plan_assignments tpa 
    WHERE tpa.training_plan_id = tp.id AND tpa.user_id = tp.student_id
);

-- 4. Update existing assignments that don't have dates yet (copy from plan)
UPDATE training_plan_assignments tpa
JOIN training_plans tp ON tp.id = tpa.training_plan_id
SET 
    tpa.start_date = COALESCE(tpa.start_date, tp.start_date),
    tpa.end_date = COALESCE(tpa.end_date, tp.end_date),
    tpa.status = COALESCE(tpa.status, 'PENDING')
WHERE tpa.start_date IS NULL;
