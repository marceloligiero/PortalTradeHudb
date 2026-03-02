-- Migration: Add pause/resume, status tracking, and error concepts
-- Date: 2026-01-06

-- =====================================================
-- 1. LESSON_PROGRESS - Add pause/resume fields
-- =====================================================
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS training_plan_id INT NULL,
ADD COLUMN IF NOT EXISTS user_id INT NULL,
ADD COLUMN IF NOT EXISTS paused_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS accumulated_seconds INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS finished_by INT NULL;

-- Update status default and allow more states
ALTER TABLE lesson_progress 
MODIFY COLUMN status VARCHAR(50) DEFAULT 'NOT_STARTED';

-- Add foreign keys for lesson_progress
ALTER TABLE lesson_progress
ADD CONSTRAINT fk_lesson_progress_training_plan 
FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE SET NULL;

ALTER TABLE lesson_progress
ADD CONSTRAINT fk_lesson_progress_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE lesson_progress
ADD CONSTRAINT fk_lesson_progress_finisher 
FOREIGN KEY (finished_by) REFERENCES users(id) ON DELETE SET NULL;

-- Make enrollment_id nullable (can use user_id + training_plan_id instead)
ALTER TABLE lesson_progress 
MODIFY COLUMN enrollment_id INT NULL;

-- =====================================================
-- 2. TRAINING_PLANS - Add status and finalization
-- =====================================================
ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS completed_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS finalized_by INT NULL;

ALTER TABLE training_plans
ADD CONSTRAINT fk_training_plans_finalizer 
FOREIGN KEY (finalized_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- 3. TRAINING_PLAN_COURSES - Add course completion status
-- =====================================================
ALTER TABLE training_plan_courses 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS completed_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS finalized_by INT NULL;

ALTER TABLE training_plan_courses
ADD CONSTRAINT fk_training_plan_courses_finalizer 
FOREIGN KEY (finalized_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- 4. CHALLENGE_SUBMISSIONS - Add error concepts
-- =====================================================
ALTER TABLE challenge_submissions 
ADD COLUMN IF NOT EXISTS error_methodology INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_knowledge INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_detail INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_procedure INT DEFAULT 0;

-- =====================================================
-- 5. Create LESSON_PAUSES table for detailed pause history
-- =====================================================
CREATE TABLE IF NOT EXISTS lesson_pauses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_progress_id INT NOT NULL,
    paused_at DATETIME NOT NULL,
    resumed_at DATETIME NULL,
    duration_seconds INT NULL,
    pause_reason VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_progress_id) REFERENCES lesson_progress(id) ON DELETE CASCADE
);

-- =====================================================
-- 6. Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_lesson_progress_status ON lesson_progress(status);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_plan ON lesson_progress(training_plan_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_status ON training_plans(status);
CREATE INDEX IF NOT EXISTS idx_training_plan_courses_status ON training_plan_courses(status);

-- =====================================================
-- 7. Update existing records with calculated status
-- =====================================================
UPDATE lesson_progress 
SET status = 'COMPLETED' 
WHERE completed_at IS NOT NULL AND status != 'COMPLETED';

UPDATE lesson_progress 
SET status = 'IN_PROGRESS' 
WHERE started_at IS NOT NULL AND completed_at IS NULL AND status = 'NOT_STARTED';

UPDATE training_plans 
SET status = 'PENDING' 
WHERE status IS NULL OR status = '';

UPDATE training_plan_courses 
SET status = 'PENDING' 
WHERE status IS NULL OR status = '';
