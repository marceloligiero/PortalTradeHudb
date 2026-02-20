-- =====================================================================
-- SCRIPT UNIFICADO DE MIGRAÇÃO - TradeHub Production
-- Contém TODAS as alterações de base de dados
-- Seguro para executar múltiplas vezes (idempotente)
-- Data: Gerado em 2025
-- =====================================================================

USE tradehub_db;

-- =====================================================================
-- HELPER: Procedimento para adicionar colunas condicionalmente
-- (MySQL 8.x não suporta ALTER TABLE ADD COLUMN IF NOT EXISTS)
-- =====================================================================

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = p_table 
        AND column_name = p_column
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Helper para adicionar FK condicionalmente
DROP PROCEDURE IF EXISTS add_fk_if_not_exists;

DELIMITER //
CREATE PROCEDURE add_fk_if_not_exists(
    IN p_constraint_name VARCHAR(64),
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_ref_table VARCHAR(64),
    IN p_ref_column VARCHAR(64),
    IN p_on_delete VARCHAR(50)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = DATABASE() 
        AND constraint_name = p_constraint_name
        AND table_name = p_table
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD CONSTRAINT `', p_constraint_name, 
                          '` FOREIGN KEY (`', p_column, '`) REFERENCES `', p_ref_table, 
                          '`(`', p_ref_column, '`) ON DELETE ', p_on_delete);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Helper para criar índice condicionalmente
DROP PROCEDURE IF EXISTS add_index_if_not_exists;

DELIMITER //
CREATE PROCEDURE add_index_if_not_exists(
    IN p_index_name VARCHAR(64),
    IN p_table VARCHAR(64),
    IN p_columns VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
        AND table_name = p_table 
        AND index_name = p_index_name
    ) THEN
        SET @sql = CONCAT('CREATE INDEX `', p_index_name, '` ON `', p_table, '`(', p_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;


-- =====================================================================
-- SECÇÃO 1: ALTERAÇÕES EM TABELAS EXISTENTES (ADD COLUMN)
-- =====================================================================

SELECT '=== SECÇÃO 1: Adicionando colunas a tabelas existentes ===' AS progress;

-- ----- 1.1 users -----
CALL add_column_if_not_exists('users', 'validated_at', 'DATETIME NULL');

-- ----- 1.2 training_plans -----
CALL add_column_if_not_exists('training_plans', 'student_id', 'INT NULL');
CALL add_column_if_not_exists('training_plans', 'start_date', 'DATETIME NULL');
CALL add_column_if_not_exists('training_plans', 'end_date', 'DATETIME NULL');
CALL add_column_if_not_exists('training_plans', 'is_permanent', 'TINYINT(1) DEFAULT 0');
CALL add_column_if_not_exists('training_plans', 'status', "VARCHAR(50) DEFAULT 'PENDING'");
CALL add_column_if_not_exists('training_plans', 'completed_at', 'DATETIME NULL');
CALL add_column_if_not_exists('training_plans', 'finalized_by', 'INT NULL');

-- ----- 1.3 courses -----
CALL add_column_if_not_exists('courses', 'level', 'VARCHAR(20) DEFAULT NULL');

-- ----- 1.4 lessons -----
CALL add_column_if_not_exists('lessons', 'description', 'TEXT NULL');
CALL add_column_if_not_exists('lessons', 'lesson_type', "VARCHAR(50) DEFAULT 'THEORETICAL'");
CALL add_column_if_not_exists('lessons', 'started_by', "VARCHAR(50) DEFAULT 'TRAINER'");
CALL add_column_if_not_exists('lessons', 'video_url', 'VARCHAR(500) NULL');
CALL add_column_if_not_exists('lessons', 'materials_url', 'VARCHAR(500) NULL');

-- ----- 1.5 lesson_progress -----
CALL add_column_if_not_exists('lesson_progress', 'training_plan_id', 'INT NULL');
CALL add_column_if_not_exists('lesson_progress', 'user_id', 'INT NULL');
CALL add_column_if_not_exists('lesson_progress', 'is_released', 'TINYINT(1) DEFAULT 0');
CALL add_column_if_not_exists('lesson_progress', 'released_by', 'INT NULL');
CALL add_column_if_not_exists('lesson_progress', 'released_at', 'DATETIME NULL');
CALL add_column_if_not_exists('lesson_progress', 'paused_at', 'DATETIME NULL');
CALL add_column_if_not_exists('lesson_progress', 'accumulated_seconds', 'INT DEFAULT 0');
CALL add_column_if_not_exists('lesson_progress', 'is_paused', 'TINYINT(1) DEFAULT 0');
CALL add_column_if_not_exists('lesson_progress', 'finished_by', 'INT NULL');
CALL add_column_if_not_exists('lesson_progress', 'student_confirmed', 'TINYINT(1) DEFAULT 0');
CALL add_column_if_not_exists('lesson_progress', 'student_confirmed_at', 'DATETIME NULL');

-- ----- 1.6 challenges -----
CALL add_column_if_not_exists('challenges', 'difficulty', "VARCHAR(20) DEFAULT 'medium'");
CALL add_column_if_not_exists('challenges', 'challenge_type', "VARCHAR(50) DEFAULT 'COMPLETE'");
CALL add_column_if_not_exists('challenges', 'time_limit_minutes', 'INT DEFAULT 60');
CALL add_column_if_not_exists('challenges', 'target_mpu', 'FLOAT NULL');
CALL add_column_if_not_exists('challenges', 'is_active', 'TINYINT(1) DEFAULT 1');
CALL add_column_if_not_exists('challenges', 'use_volume_kpi', 'TINYINT(1) DEFAULT 1');
CALL add_column_if_not_exists('challenges', 'use_mpu_kpi', 'TINYINT(1) DEFAULT 1');
CALL add_column_if_not_exists('challenges', 'use_errors_kpi', 'TINYINT(1) DEFAULT 1');
CALL add_column_if_not_exists('challenges', 'kpi_mode', "VARCHAR(20) DEFAULT 'AUTO'");
CALL add_column_if_not_exists('challenges', 'allow_retry', 'TINYINT(1) DEFAULT 0');
CALL add_column_if_not_exists('challenges', 'is_released', 'TINYINT(1) DEFAULT 0');
CALL add_column_if_not_exists('challenges', 'released_at', 'DATETIME NULL');
CALL add_column_if_not_exists('challenges', 'released_by', 'INT NULL');

-- ----- 1.7 challenge_submissions -----
CALL add_column_if_not_exists('challenge_submissions', 'status', "VARCHAR(50) DEFAULT 'IN_PROGRESS'");
CALL add_column_if_not_exists('challenge_submissions', 'training_plan_id', 'INT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'submission_type', "VARCHAR(50) DEFAULT 'COMPLETE'");
CALL add_column_if_not_exists('challenge_submissions', 'total_operations', 'INT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'total_time_minutes', 'INT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'errors_count', 'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'error_methodology', 'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'error_knowledge', 'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'error_detail', 'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'error_procedure', 'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'operation_reference', 'VARCHAR(255) NULL');
CALL add_column_if_not_exists('challenge_submissions', 'calculated_mpu', 'FLOAT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'mpu_vs_target', 'FLOAT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'score', 'FLOAT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'submitted_by', 'INT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'reviewed_by', 'INT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'retry_count', 'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'is_retry_allowed', 'TINYINT(1) DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'trainer_notes', 'TEXT NULL');

-- ----- 1.8 training_plan_assignments (enrollment fields) -----
CALL add_column_if_not_exists('training_plan_assignments', 'start_date', 'DATETIME NULL');
CALL add_column_if_not_exists('training_plan_assignments', 'end_date', 'DATETIME NULL');
CALL add_column_if_not_exists('training_plan_assignments', 'status', "VARCHAR(50) DEFAULT 'PENDING'");
CALL add_column_if_not_exists('training_plan_assignments', 'progress_percentage', 'FLOAT DEFAULT 0');
CALL add_column_if_not_exists('training_plan_assignments', 'notes', 'TEXT NULL');

-- ----- 1.9 training_plan_courses -----
CALL add_column_if_not_exists('training_plan_courses', 'status', "VARCHAR(50) DEFAULT 'PENDING'");
CALL add_column_if_not_exists('training_plan_courses', 'completed_at', 'DATETIME NULL');
CALL add_column_if_not_exists('training_plan_courses', 'finalized_by', 'INT NULL');


-- =====================================================================
-- SECÇÃO 2: MODIFICAR COLUNAS EXISTENTES (NULLABLE, DEFAULTS)
-- =====================================================================

SELECT '=== SECÇÃO 2: Modificando colunas existentes ===' AS progress;

-- training_plans: trainer_id nullable (trainers podem ser atribuídos depois)
ALTER TABLE training_plans MODIFY COLUMN trainer_id INT NULL;

-- training_plans: bank_id e product_id nullable (multi-bank/product)
-- Estas colunas podem não existir se foram criadas já nullable. Usar handler de erro.
DROP PROCEDURE IF EXISTS safe_modify_column;

DELIMITER //
CREATE PROCEDURE safe_modify_column(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition VARCHAR(500)
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = p_table 
        AND column_name = p_column
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` MODIFY COLUMN `', p_column, '` ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

CALL safe_modify_column('training_plans', 'bank_id', 'INT NULL');
CALL safe_modify_column('training_plans', 'product_id', 'INT NULL');
CALL safe_modify_column('courses', 'bank_id', 'INT NULL');
CALL safe_modify_column('courses', 'product_id', 'INT NULL');

-- lesson_progress: started_at pode ser NULL (preenchido quando formando inicia)
CALL safe_modify_column('lesson_progress', 'started_at', 'DATETIME NULL');


-- =====================================================================
-- SECÇÃO 3: CRIAR NOVAS TABELAS
-- =====================================================================

SELECT '=== SECÇÃO 3: Criando novas tabelas ===' AS progress;

-- 3.1 password_reset_tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_prt_token (token),
    INDEX idx_prt_user_id (user_id),
    INDEX idx_prt_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2 course_banks (multi-bank por curso)
CREATE TABLE IF NOT EXISTS course_banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    bank_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_bank (course_id, bank_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.3 course_products (multi-product por curso)
CREATE TABLE IF NOT EXISTS course_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_product (course_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.4 training_plan_banks (multi-bank por plano)
CREATE TABLE IF NOT EXISTS training_plan_banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_plan_id INT NOT NULL,
    bank_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_bank (training_plan_id, bank_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.5 training_plan_products (multi-product por plano)
CREATE TABLE IF NOT EXISTS training_plan_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_plan_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_product (training_plan_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.6 training_plan_trainers (múltiplos formadores por plano)
CREATE TABLE IF NOT EXISTS training_plan_trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_plan_id INT NOT NULL,
    trainer_id INT NOT NULL,
    is_primary TINYINT(1) DEFAULT 0,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NULL,
    FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_plan_trainer (training_plan_id, trainer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.7 challenge_operations (operações individuais de desafios COMPLETE)
CREATE TABLE IF NOT EXISTS challenge_operations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    operation_number INT NOT NULL,
    operation_reference VARCHAR(255) NULL,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    duration_seconds INT NULL,
    has_error TINYINT(1) DEFAULT 0,
    is_approved TINYINT(1) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES challenge_submissions(id) ON DELETE CASCADE,
    INDEX idx_co_submission (submission_id),
    INDEX idx_co_reference (operation_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.8 operation_errors (erros por operação)
CREATE TABLE IF NOT EXISTS operation_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operation_id INT NOT NULL,
    error_type VARCHAR(50) NOT NULL COMMENT 'METHODOLOGY, KNOWLEDGE, DETAIL, PROCEDURE',
    description VARCHAR(160) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operation_id) REFERENCES challenge_operations(id) ON DELETE CASCADE,
    INDEX idx_oe_operation (operation_id),
    INDEX idx_oe_error_type (error_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.9 submission_errors (erros para desafios SUMMARY)
CREATE TABLE IF NOT EXISTS submission_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    error_type VARCHAR(50) NOT NULL COMMENT 'METHODOLOGY, KNOWLEDGE, DETAIL, PROCEDURE',
    description VARCHAR(500) NULL,
    operation_reference VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES challenge_submissions(id) ON DELETE CASCADE,
    INDEX idx_se_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.10 challenge_parts (partes de desafios COMPLETE)
CREATE TABLE IF NOT EXISTS challenge_parts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    submission_id INT NOT NULL,
    part_number INT NOT NULL,
    operations_count INT NOT NULL,
    started_at DATETIME NOT NULL,
    completed_at DATETIME NOT NULL,
    duration_minutes FLOAT NULL,
    mpu FLOAT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES challenge_submissions(id) ON DELETE CASCADE,
    INDEX idx_cp_challenge (challenge_id),
    INDEX idx_cp_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.11 challenge_releases (liberação de desafios para estudantes)
CREATE TABLE IF NOT EXISTS challenge_releases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    student_id INT NOT NULL,
    training_plan_id INT NULL,
    released_by INT NOT NULL,
    released_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (released_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cr_challenge (challenge_id),
    INDEX idx_cr_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.12 lesson_pauses (histórico de pausas)
CREATE TABLE IF NOT EXISTS lesson_pauses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_progress_id INT NOT NULL,
    paused_at DATETIME NOT NULL,
    resumed_at DATETIME NULL,
    duration_seconds INT NULL,
    pause_reason VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_progress_id) REFERENCES lesson_progress(id) ON DELETE CASCADE,
    INDEX idx_lp_progress (lesson_progress_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.13 ratings (sistema de avaliações)
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_trainer FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_training_plan FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    
    CONSTRAINT chk_stars CHECK (stars >= 0 AND stars <= 5),
    
    INDEX idx_ratings_user (user_id),
    INDEX idx_ratings_type (rating_type),
    INDEX idx_ratings_course (course_id),
    INDEX idx_ratings_lesson (lesson_id),
    INDEX idx_ratings_challenge (challenge_id),
    INDEX idx_ratings_trainer (trainer_id),
    INDEX idx_ratings_training_plan (training_plan_id),
    INDEX idx_ratings_stars (stars),
    INDEX idx_ratings_created (created_at),
    
    UNIQUE KEY unique_user_course_rating (user_id, rating_type, course_id),
    UNIQUE KEY unique_user_lesson_rating (user_id, rating_type, lesson_id),
    UNIQUE KEY unique_user_challenge_rating (user_id, rating_type, challenge_id),
    UNIQUE KEY unique_user_trainer_rating (user_id, rating_type, trainer_id),
    UNIQUE KEY unique_user_plan_rating (user_id, rating_type, training_plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- SECÇÃO 4: FOREIGN KEYS PARA COLUNAS ADICIONADAS
-- =====================================================================

SELECT '=== SECÇÃO 4: Adicionando foreign keys ===' AS progress;

-- training_plans
CALL add_fk_if_not_exists('fk_tp_student', 'training_plans', 'student_id', 'users', 'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_tp_finalized_by', 'training_plans', 'finalized_by', 'users', 'id', 'SET NULL');

-- lesson_progress
CALL add_fk_if_not_exists('fk_lp_training_plan', 'lesson_progress', 'training_plan_id', 'training_plans', 'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_lp_user', 'lesson_progress', 'user_id', 'users', 'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_lp_released_by', 'lesson_progress', 'released_by', 'users', 'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_lp_finished_by', 'lesson_progress', 'finished_by', 'users', 'id', 'SET NULL');

-- challenges
CALL add_fk_if_not_exists('fk_ch_released_by', 'challenges', 'released_by', 'users', 'id', 'SET NULL');

-- challenge_submissions
CALL add_fk_if_not_exists('fk_cs_training_plan', 'challenge_submissions', 'training_plan_id', 'training_plans', 'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_cs_submitted_by', 'challenge_submissions', 'submitted_by', 'users', 'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_cs_reviewed_by', 'challenge_submissions', 'reviewed_by', 'users', 'id', 'SET NULL');

-- training_plan_courses
CALL add_fk_if_not_exists('fk_tpc_finalized_by', 'training_plan_courses', 'finalized_by', 'users', 'id', 'SET NULL');


-- =====================================================================
-- SECÇÃO 5: MIGRAÇÃO DE DADOS
-- =====================================================================

SELECT '=== SECÇÃO 5: Migração de dados ===' AS progress;

-- 5.1 Migrar bank/product de cursos únicos para tabelas multi
INSERT IGNORE INTO course_banks (course_id, bank_id)
SELECT id, bank_id FROM courses WHERE bank_id IS NOT NULL;

INSERT IGNORE INTO course_products (course_id, product_id)
SELECT id, product_id FROM courses WHERE product_id IS NOT NULL;

-- 5.2 Migrar bank/product de planos únicos para tabelas multi
INSERT IGNORE INTO training_plan_banks (training_plan_id, bank_id)
SELECT id, bank_id FROM training_plans WHERE bank_id IS NOT NULL;

INSERT IGNORE INTO training_plan_products (training_plan_id, product_id)
SELECT id, product_id FROM training_plans WHERE product_id IS NOT NULL;

-- 5.3 Migrar formador principal para tabela de múltiplos formadores
INSERT INTO training_plan_trainers (training_plan_id, trainer_id, is_primary, assigned_by)
SELECT id, trainer_id, 1, created_by
FROM training_plans
WHERE trainer_id IS NOT NULL
ON DUPLICATE KEY UPDATE is_primary = 1;

-- 5.4 Migrar student_id de training_plans para training_plan_assignments
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

-- 5.5 Atualizar assignments existentes sem datas (copiar do plano)
UPDATE training_plan_assignments tpa
JOIN training_plans tp ON tp.id = tpa.training_plan_id
SET 
    tpa.start_date = COALESCE(tpa.start_date, tp.start_date),
    tpa.end_date = COALESCE(tpa.end_date, tp.end_date),
    tpa.status = COALESCE(tpa.status, 'PENDING')
WHERE tpa.start_date IS NULL;

-- 5.6 Atualizar status de challenge_submissions existentes
UPDATE challenge_submissions 
SET status = 'REVIEWED' 
WHERE completed_at IS NOT NULL AND (status IS NULL OR status = 'IN_PROGRESS');

-- 5.7 Defaults para registros existentes
UPDATE courses SET level = 'BEGINNER' WHERE level IS NULL;
UPDATE lessons SET started_by = 'TRAINER' WHERE started_by IS NULL;
UPDATE challenges SET kpi_mode = 'AUTO' WHERE kpi_mode IS NULL;
UPDATE challenges SET allow_retry = 0 WHERE allow_retry IS NULL;
UPDATE challenges SET use_volume_kpi = 1 WHERE use_volume_kpi IS NULL;
UPDATE challenges SET use_mpu_kpi = 1 WHERE use_mpu_kpi IS NULL;
UPDATE challenges SET use_errors_kpi = 1 WHERE use_errors_kpi IS NULL;
UPDATE challenges SET is_released = 0 WHERE is_released IS NULL;
UPDATE lesson_progress SET student_confirmed = 0 WHERE student_confirmed IS NULL;
UPDATE training_plans SET is_permanent = 0 WHERE is_permanent IS NULL;


-- =====================================================================
-- SECÇÃO 6: ÍNDICES ADICIONAIS
-- =====================================================================

SELECT '=== SECÇÃO 6: Criando índices ===' AS progress;

CALL add_index_if_not_exists('idx_lp_status', 'lesson_progress', '`status`');
CALL add_index_if_not_exists('idx_lp_is_released', 'lesson_progress', '`is_released`');
CALL add_index_if_not_exists('idx_cb_course', 'course_banks', '`course_id`');
CALL add_index_if_not_exists('idx_cb_bank', 'course_banks', '`bank_id`');
CALL add_index_if_not_exists('idx_cp_course', 'course_products', '`course_id`');
CALL add_index_if_not_exists('idx_cp_product', 'course_products', '`product_id`');
CALL add_index_if_not_exists('idx_tpb_plan', 'training_plan_banks', '`training_plan_id`');
CALL add_index_if_not_exists('idx_tpb_bank', 'training_plan_banks', '`bank_id`');
CALL add_index_if_not_exists('idx_tpp_plan', 'training_plan_products', '`training_plan_id`');
CALL add_index_if_not_exists('idx_tpp_product', 'training_plan_products', '`product_id`');
CALL add_index_if_not_exists('idx_tpt_plan', 'training_plan_trainers', '`training_plan_id`');
CALL add_index_if_not_exists('idx_tpt_trainer', 'training_plan_trainers', '`trainer_id`');


-- =====================================================================
-- SECÇÃO 7: LIMPEZA
-- =====================================================================

SELECT '=== SECÇÃO 7: Limpeza ===' AS progress;

DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DROP PROCEDURE IF EXISTS add_fk_if_not_exists;
DROP PROCEDURE IF EXISTS add_index_if_not_exists;
DROP PROCEDURE IF EXISTS safe_modify_column;


-- =====================================================================
-- CONCLUÍDO!
-- =====================================================================

SELECT '✅ Migração unificada concluída com sucesso!' AS resultado;
SELECT CONCAT('Base de dados: ', DATABASE()) AS info;
SELECT CONCAT('Data de execução: ', NOW()) AS info;

-- Resumo das tabelas
SELECT TABLE_NAME, TABLE_ROWS
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
ORDER BY TABLE_NAME;
