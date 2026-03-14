-- Migration: Create ratings table for evaluations system
-- Run this migration to add the ratings table to the database

CREATE TABLE IF NOT EXISTS ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    rating_type VARCHAR(50) NOT NULL COMMENT 'COURSE, LESSON, CHALLENGE, TRAINER, TRAINING_PLAN',
    course_id INT NULL,
    lesson_id INT NULL,
    challenge_id INT NULL,
    trainer_id INT NULL,
    training_plan_id INT NULL,
    stars INT NOT NULL DEFAULT 0 COMMENT 'Rating from 0 to 5 stars',
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_trainer FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_training_plan FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_stars CHECK (stars >= 0 AND stars <= 5),
    
    -- Indexes for performance
    INDEX idx_ratings_user (user_id),
    INDEX idx_ratings_type (rating_type),
    INDEX idx_ratings_course (course_id),
    INDEX idx_ratings_lesson (lesson_id),
    INDEX idx_ratings_challenge (challenge_id),
    INDEX idx_ratings_trainer (trainer_id),
    INDEX idx_ratings_training_plan (training_plan_id),
    INDEX idx_ratings_stars (stars),
    INDEX idx_ratings_created (created_at),
    
    -- Unique constraint to prevent duplicate ratings
    UNIQUE KEY unique_user_course_rating (user_id, rating_type, course_id),
    UNIQUE KEY unique_user_lesson_rating (user_id, rating_type, lesson_id),
    UNIQUE KEY unique_user_challenge_rating (user_id, rating_type, challenge_id),
    UNIQUE KEY unique_user_trainer_rating (user_id, rating_type, trainer_id),
    UNIQUE KEY unique_user_plan_rating (user_id, rating_type, training_plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE ratings COMMENT = 'Stores student ratings for courses, lessons, challenges, trainers and training plans';
