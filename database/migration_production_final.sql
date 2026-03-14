-- =====================================================================
-- MIGRAÇÃO UNIFICADA FINAL — TradeHub (MySQL 8.x)
-- =====================================================================
-- Combina TODAS as migrações do projeto num único script.
-- Seguro para executar múltiplas vezes (idempotente).
--
-- Pré-requisitos:
--   • MySQL 8.x com a base tradehub_db já criada
--   • Tabelas base já existentes (criadas pelo SQLAlchemy ORM):
--     users, banks, products, courses, lessons, enrollments,
--     lesson_progress, challenges, challenge_submissions,
--     training_plans, training_plan_courses,
--     training_plan_assignments, certificates
--
-- Instrução:
--   mysql -u <user> -p tradehub_db < migration_production_final.sql
--
-- Gerado em: 2026-06
-- =====================================================================

-- NOTA: Não usa USE <database> — a ligação já aponta para a BD correta via DATABASE_URL.

SET FOREIGN_KEY_CHECKS = 0;


-- =====================================================================
-- PROCEDIMENTOS AUXILIARES (idempotentes)
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
          AND table_name   = p_table
          AND column_name  = p_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS add_fk_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_fk_if_not_exists(
    IN p_fk_name VARCHAR(64),
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_ref_table VARCHAR(64),
    IN p_ref_column VARCHAR(64),
    IN p_on_delete VARCHAR(50)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema    = DATABASE()
          AND table_name      = p_table
          AND constraint_name = p_fk_name
          AND constraint_type = 'FOREIGN KEY'
    ) THEN
        SET @ddl = CONCAT(
            'ALTER TABLE `', p_table, '` ADD CONSTRAINT `', p_fk_name,
            '` FOREIGN KEY (`', p_column, '`) REFERENCES `', p_ref_table,
            '`(`', p_ref_column, '`) ON DELETE ', p_on_delete
        );
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS add_index_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_index_if_not_exists(
    IN p_index_name VARCHAR(64),
    IN p_table VARCHAR(64),
    IN p_columns VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name   = p_table
          AND index_name   = p_index_name
    ) THEN
        SET @ddl = CONCAT('CREATE INDEX `', p_index_name, '` ON `', p_table, '`(', p_columns, ')');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS safe_modify_column;
DELIMITER //
CREATE PROCEDURE safe_modify_column(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition VARCHAR(500)
)
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name   = p_table
          AND column_name  = p_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` MODIFY COLUMN `', p_column, '` ', p_definition);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;


-- =====================================================================
-- SECÇÃO 1: ADICIONAR COLUNAS ÀS TABELAS EXISTENTES
-- =====================================================================

SELECT '=== SECÇÃO 1: Adicionando colunas ===' AS progress;

-- ─── 1.1 users ──────────────────────────────────────────────────────
CALL add_column_if_not_exists('users', 'validated_at',  'DATETIME NULL');
CALL add_column_if_not_exists('users', 'is_trainer',    'BOOLEAN NOT NULL DEFAULT FALSE');
CALL add_column_if_not_exists('users', 'is_tutor',      'BOOLEAN NOT NULL DEFAULT FALSE');
CALL add_column_if_not_exists('users', 'is_liberador',  'BOOLEAN NOT NULL DEFAULT FALSE');
CALL add_column_if_not_exists('users', 'tutor_id',      'INT NULL');
CALL add_column_if_not_exists('users', 'team_id',       'INT NULL');

-- ─── 1.2 training_plans ────────────────────────────────────────────
CALL add_column_if_not_exists('training_plans', 'student_id',    'INT NULL');
CALL add_column_if_not_exists('training_plans', 'start_date',    'DATETIME NULL');
CALL add_column_if_not_exists('training_plans', 'end_date',      'DATETIME NULL');
CALL add_column_if_not_exists('training_plans', 'is_permanent',  'BOOLEAN DEFAULT FALSE');
CALL add_column_if_not_exists('training_plans', 'status',        'VARCHAR(50) DEFAULT \'PENDING\'');
CALL add_column_if_not_exists('training_plans', 'completed_at',  'DATETIME NULL');
CALL add_column_if_not_exists('training_plans', 'finalized_by',  'INT NULL');

-- ─── 1.3 courses ───────────────────────────────────────────────────
CALL add_column_if_not_exists('courses', 'level', 'VARCHAR(20) DEFAULT NULL');

-- ─── 1.4 lessons ───────────────────────────────────────────────────
CALL add_column_if_not_exists('lessons', 'description',    'TEXT NULL');
CALL add_column_if_not_exists('lessons', 'lesson_type',    'VARCHAR(50) DEFAULT \'THEORETICAL\'');
CALL add_column_if_not_exists('lessons', 'started_by',     'VARCHAR(50) DEFAULT \'TRAINER\'');
CALL add_column_if_not_exists('lessons', 'video_url',      'VARCHAR(500) NULL');
CALL add_column_if_not_exists('lessons', 'materials_url',  'VARCHAR(500) NULL');

-- ─── 1.5 lesson_progress ──────────────────────────────────────────
CALL add_column_if_not_exists('lesson_progress', 'training_plan_id',    'INT NULL');
CALL add_column_if_not_exists('lesson_progress', 'user_id',            'INT NULL');
CALL add_column_if_not_exists('lesson_progress', 'is_released',        'BOOLEAN DEFAULT FALSE');
CALL add_column_if_not_exists('lesson_progress', 'released_at',        'DATETIME NULL');
CALL add_column_if_not_exists('lesson_progress', 'released_by',        'INT NULL');
CALL add_column_if_not_exists('lesson_progress', 'finished_by',        'INT NULL');
CALL add_column_if_not_exists('lesson_progress', 'paused_at',          'DATETIME NULL');
CALL add_column_if_not_exists('lesson_progress', 'accumulated_seconds','INT DEFAULT 0');
CALL add_column_if_not_exists('lesson_progress', 'is_paused',          'BOOLEAN DEFAULT FALSE');
CALL add_column_if_not_exists('lesson_progress', 'student_confirmed',     'BOOLEAN DEFAULT FALSE');
CALL add_column_if_not_exists('lesson_progress', 'student_confirmed_at',  'DATETIME NULL');

-- ─── 1.6 challenges ───────────────────────────────────────────────
CALL add_column_if_not_exists('challenges', 'challenge_type',     'VARCHAR(50) DEFAULT \'COMPLETE\'');
CALL add_column_if_not_exists('challenges', 'difficulty',         'VARCHAR(20) DEFAULT \'medium\'');
CALL add_column_if_not_exists('challenges', 'time_limit_minutes', 'INT DEFAULT 60');
CALL add_column_if_not_exists('challenges', 'target_mpu',         'FLOAT DEFAULT 1.0');
CALL add_column_if_not_exists('challenges', 'max_errors',         'INT DEFAULT 0');
CALL add_column_if_not_exists('challenges', 'use_volume_kpi',     'BOOLEAN DEFAULT TRUE');
CALL add_column_if_not_exists('challenges', 'use_mpu_kpi',        'BOOLEAN DEFAULT TRUE');
CALL add_column_if_not_exists('challenges', 'use_errors_kpi',     'BOOLEAN DEFAULT TRUE');
CALL add_column_if_not_exists('challenges', 'kpi_mode',           'VARCHAR(20) DEFAULT \'AUTO\'');
CALL add_column_if_not_exists('challenges', 'allow_retry',        'BOOLEAN DEFAULT FALSE');
CALL add_column_if_not_exists('challenges', 'is_released',        'BOOLEAN DEFAULT FALSE');
CALL add_column_if_not_exists('challenges', 'released_at',        'DATETIME NULL');
CALL add_column_if_not_exists('challenges', 'released_by',        'INT NULL');

-- ─── 1.7 challenge_submissions ─────────────────────────────────────
CALL add_column_if_not_exists('challenge_submissions', 'training_plan_id',    'INT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'submission_type',     'VARCHAR(50) DEFAULT \'COMPLETE\'');
CALL add_column_if_not_exists('challenge_submissions', 'status',             'VARCHAR(50) DEFAULT \'IN_PROGRESS\'');
CALL add_column_if_not_exists('challenge_submissions', 'total_operations',    'INT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'total_time_minutes',  'INT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'errors_count',        'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'error_methodology',   'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'error_knowledge',     'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'error_detail',        'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'error_procedure',     'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'operation_reference', 'VARCHAR(255) NULL');
CALL add_column_if_not_exists('challenge_submissions', 'completed_at',        'DATETIME NULL');
CALL add_column_if_not_exists('challenge_submissions', 'calculated_mpu',      'FLOAT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'mpu_vs_target',       'FLOAT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'score',               'FLOAT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'submitted_by',        'INT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'reviewed_by',         'INT NULL');
CALL add_column_if_not_exists('challenge_submissions', 'retry_count',         'INT DEFAULT 0');
CALL add_column_if_not_exists('challenge_submissions', 'is_retry_allowed',    'BOOLEAN DEFAULT FALSE');
CALL add_column_if_not_exists('challenge_submissions', 'trainer_notes',       'TEXT NULL');

-- ─── 1.8 training_plan_assignments ─────────────────────────────────
CALL add_column_if_not_exists('training_plan_assignments', 'start_date',           'DATETIME NULL');
CALL add_column_if_not_exists('training_plan_assignments', 'end_date',             'DATETIME NULL');
CALL add_column_if_not_exists('training_plan_assignments', 'status',               'VARCHAR(50) DEFAULT \'PENDING\'');
CALL add_column_if_not_exists('training_plan_assignments', 'progress_percentage',  'FLOAT DEFAULT 0');
CALL add_column_if_not_exists('training_plan_assignments', 'notes',                'TEXT NULL');

-- ─── 1.9 training_plan_courses ─────────────────────────────────────
CALL add_column_if_not_exists('training_plan_courses', 'status',        'VARCHAR(50) DEFAULT \'PENDING\'');
CALL add_column_if_not_exists('training_plan_courses', 'completed_at',  'DATETIME NULL');
CALL add_column_if_not_exists('training_plan_courses', 'finalized_by',  'INT NULL');


-- =====================================================================
-- SECÇÃO 2: MODIFICAR COLUNAS EXISTENTES
-- =====================================================================

SELECT '=== SECÇÃO 2: Modificando colunas ===' AS progress;

-- Tornar trainer_id opcional nos planos
CALL safe_modify_column('training_plans', 'trainer_id', 'INT NULL');
-- Tornar bank_id e product_id opcionais nos cursos (multi-bank)
CALL safe_modify_column('courses', 'bank_id', 'INT NULL');
CALL safe_modify_column('courses', 'product_id', 'INT NULL');
-- Tornar enrollment_id opcional no lesson_progress (usa user_id + training_plan_id)
CALL safe_modify_column('lesson_progress', 'enrollment_id', 'INT NULL');
-- Tornar started_at opcional nas submissions
CALL safe_modify_column('challenge_submissions', 'started_at', 'DATETIME NULL');
-- Expandir status
CALL safe_modify_column('lesson_progress', 'status', 'VARCHAR(50) DEFAULT \'NOT_STARTED\'');


-- =====================================================================
-- SECÇÃO 3: CRIAR TABELAS NOVAS (sem FK a outras tabelas novas)
-- =====================================================================

SELECT '=== SECÇÃO 3: Criando tabelas novas ===' AS progress;

-- 3.1 password_reset_tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_prt_token (token),
    INDEX idx_prt_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2 course_banks (multi-banco por curso)
CREATE TABLE IF NOT EXISTS course_banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    bank_id INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_bank (course_id, bank_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.3 course_products (multi-produto por curso)
CREATE TABLE IF NOT EXISTS course_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    product_id INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_product (course_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.4 training_plan_banks
CREATE TABLE IF NOT EXISTS training_plan_banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_plan_id INT NOT NULL,
    bank_id INT NOT NULL,
    FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_bank (training_plan_id, bank_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.5 training_plan_products
CREATE TABLE IF NOT EXISTS training_plan_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_plan_id INT NOT NULL,
    product_id INT NOT NULL,
    FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_product (training_plan_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.6 training_plan_trainers (múltiplos formadores por plano)
CREATE TABLE IF NOT EXISTS training_plan_trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_plan_id INT NOT NULL,
    trainer_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    assigned_by INT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_plan_trainer (training_plan_id, trainer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.7 challenge_operations (operações individuais em desafios COMPLETE)
CREATE TABLE IF NOT EXISTS challenge_operations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    operation_number INT NOT NULL,
    operation_reference VARCHAR(255) NOT NULL,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    duration_seconds INT NULL,
    has_error BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
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
    INDEX idx_oe_type (error_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.9 submission_errors (erros para desafios SUMMARY)
CREATE TABLE IF NOT EXISTS submission_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    error_type VARCHAR(50) NOT NULL,
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
    UNIQUE KEY unique_user_course_rating (user_id, rating_type, course_id),
    UNIQUE KEY unique_user_lesson_rating (user_id, rating_type, lesson_id),
    UNIQUE KEY unique_user_challenge_rating (user_id, rating_type, challenge_id),
    UNIQUE KEY unique_user_trainer_rating (user_id, rating_type, trainer_id),
    UNIQUE KEY unique_user_plan_rating (user_id, rating_type, training_plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- SECÇÃO 4: TABELAS DE DADOS MESTRES (referência)
-- =====================================================================

SELECT '=== SECÇÃO 4: Dados mestres ===' AS progress;

-- 4.1 error_impacts
CREATE TABLE IF NOT EXISTS error_impacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    level VARCHAR(10) NULL COMMENT 'Nível: ALTO ou BAIXO',
    image_url VARCHAR(500) NULL COMMENT 'URL ou Base64 da imagem do impacto',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Garante colunas level e image_url se tabela já existia
CALL add_column_if_not_exists('error_impacts', 'level',     'VARCHAR(10) NULL');
CALL add_column_if_not_exists('error_impacts', 'image_url', 'VARCHAR(500) NULL');

-- 4.2 error_origins
CREATE TABLE IF NOT EXISTS error_origins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.3 error_detected_by
CREATE TABLE IF NOT EXISTS error_detected_by (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.4 departments
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.5 activities
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    bank_id INT NULL,
    department_id INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activities_bank (bank_id),
    INDEX idx_activities_dept (department_id),
    CONSTRAINT fk_activities_bank FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL,
    CONSTRAINT fk_activities_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Garante colunas bank_id e department_id se tabela já existia
CALL add_column_if_not_exists('activities', 'bank_id',       'INT NULL');
CALL add_column_if_not_exists('activities', 'department_id', 'INT NULL');
CALL add_fk_if_not_exists('fk_activities_bank', 'activities', 'bank_id', 'banks', 'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_activities_department', 'activities', 'department_id', 'departments', 'id', 'SET NULL');

-- 4.6 error_types (depende de activities)
CREATE TABLE IF NOT EXISTS error_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    activity_id INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_error_types_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
    INDEX idx_error_types_activity (activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- SECÇÃO 5: EQUIPAS (Teams)
-- =====================================================================

SELECT '=== SECÇÃO 5: Teams ===' AS progress;

-- 5.1 teams
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    product_id INT NULL,
    manager_id INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_teams_product (product_id),
    INDEX idx_teams_manager (manager_id),
    INDEX idx_teams_active (is_active),
    CONSTRAINT fk_team_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    CONSTRAINT fk_team_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.2 team_members (M2M utilizador ↔ equipa)
CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tm_team (team_id),
    INDEX idx_tm_user (user_id),
    UNIQUE KEY unique_team_member (team_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.3 team_services (M2M equipa ↔ serviço/produto)
CREATE TABLE IF NOT EXISTS team_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_ts_team (team_id),
    INDEX idx_ts_product (product_id),
    UNIQUE KEY unique_team_service (team_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- SECÇÃO 6: PORTAL DE TUTORIA
-- =====================================================================

SELECT '=== SECÇÃO 6: Portal Tutoria ===' AS progress;

-- 6.1 Categorias de erro (Tipología)
CREATE TABLE IF NOT EXISTS tutoria_error_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    parent_id INT NULL,
    origin_id INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_tec_parent (parent_id),
    CONSTRAINT fk_tec_parent FOREIGN KEY (parent_id) REFERENCES tutoria_error_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Garante colunas adicionais se tabela já existia
CALL add_column_if_not_exists('tutoria_error_categories', 'origin_id', 'INT NULL');
CALL add_fk_if_not_exists('fk_categories_origin', 'tutoria_error_categories', 'origin_id', 'error_origins', 'id', 'SET NULL');

-- 6.2 Erros de tutoria
CREATE TABLE IF NOT EXISTS tutoria_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_occurrence DATE NOT NULL,
    date_detection DATE NULL,
    date_solution DATE NULL,
    bank_id INT NULL,
    office VARCHAR(100) NULL,
    reference_code VARCHAR(200) NULL,
    currency VARCHAR(10) NULL,
    amount DOUBLE NULL,
    final_client VARCHAR(200) NULL,
    impact_id INT NULL,
    origin_id INT NULL,
    category_id INT NULL,
    product_id INT NULL,
    detected_by_id INT NULL,
    department_id INT NULL,
    activity_id INT NULL,
    error_type_id INT NULL,
    tutorado_id INT NOT NULL,
    created_by_id INT NOT NULL,
    approver_id INT NULL,
    description TEXT NOT NULL,
    solution TEXT NULL,
    action_plan_text TEXT NULL,
    clasificacion VARCHAR(50) NULL,
    escalado TEXT NULL,
    comentarios_reunion TEXT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTO',
    tags JSON NULL,
    analysis_5_why TEXT NULL,
    is_recurrent BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_count INT NOT NULL DEFAULT 0,
    recurrence_type VARCHAR(30) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    inactivation_reason TEXT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_te_tutorado (tutorado_id),
    INDEX idx_te_category (category_id),
    INDEX idx_te_product (product_id),
    INDEX idx_te_status (status),
    INDEX idx_te_severity (severity),
    INDEX idx_te_recurrent (is_recurrent),
    CONSTRAINT fk_te_tutorado FOREIGN KEY (tutorado_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_te_creator FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_te_category FOREIGN KEY (category_id) REFERENCES tutoria_error_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_te_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Garante colunas adicionais se tabela já existia (Access fields + extras)
CALL add_column_if_not_exists('tutoria_errors', 'date_detection',     'DATE NULL');
CALL add_column_if_not_exists('tutoria_errors', 'date_solution',      'DATE NULL');
CALL add_column_if_not_exists('tutoria_errors', 'bank_id',            'INT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'office',             'VARCHAR(100) NULL');
CALL add_column_if_not_exists('tutoria_errors', 'reference_code',     'VARCHAR(200) NULL');
CALL add_column_if_not_exists('tutoria_errors', 'currency',           'VARCHAR(10) NULL');
CALL add_column_if_not_exists('tutoria_errors', 'amount',             'DOUBLE NULL');
CALL add_column_if_not_exists('tutoria_errors', 'final_client',       'VARCHAR(200) NULL');
CALL add_column_if_not_exists('tutoria_errors', 'impact_id',          'INT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'origin_id',          'INT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'detected_by_id',     'INT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'approver_id',        'INT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'department_id',      'INT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'activity_id',        'INT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'error_type_id',      'INT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'product_id',         'INT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'solution',           'TEXT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'action_plan_text',   'TEXT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'recurrence_type',    'VARCHAR(30) NULL');
CALL add_column_if_not_exists('tutoria_errors', 'clasificacion',      'VARCHAR(50) NULL');
CALL add_column_if_not_exists('tutoria_errors', 'escalado',           'TEXT NULL');
CALL add_column_if_not_exists('tutoria_errors', 'comentarios_reunion','TEXT NULL');

-- FKs para colunas adicionadas em tutoria_errors
CALL add_fk_if_not_exists('fk_error_bank',        'tutoria_errors', 'bank_id',        'banks',            'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_error_impact',      'tutoria_errors', 'impact_id',      'error_impacts',    'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_error_origin',      'tutoria_errors', 'origin_id',      'error_origins',    'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_error_detected_by', 'tutoria_errors', 'detected_by_id', 'error_detected_by','id', 'SET NULL');
CALL add_fk_if_not_exists('fk_error_approver',    'tutoria_errors', 'approver_id',    'users',            'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_error_department',  'tutoria_errors', 'department_id',  'departments',      'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_error_activity',    'tutoria_errors', 'activity_id',    'activities',       'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_errors_error_type', 'tutoria_errors', 'error_type_id',  'error_types',      'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_te_product',        'tutoria_errors', 'product_id',     'products',         'id', 'SET NULL');

-- 6.3 Motivos de erro (múltiplos por erro)
CREATE TABLE IF NOT EXISTS tutoria_error_motivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    error_id INT NOT NULL,
    typology VARCHAR(50) NOT NULL COMMENT 'METHODOLOGY | KNOWLEDGE | DETAIL | PROCEDURE',
    description VARCHAR(500) NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_tem_error (error_id),
    INDEX idx_tem_typology (typology),
    CONSTRAINT fk_tem_error FOREIGN KEY (error_id) REFERENCES tutoria_errors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.4 Planos de ação (5W2H)
CREATE TABLE IF NOT EXISTS tutoria_action_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    error_id INT NOT NULL,
    created_by_id INT NOT NULL,
    tutorado_id INT NOT NULL,
    analysis_5_why TEXT NULL,
    immediate_correction TEXT NULL,
    corrective_action TEXT NULL,
    preventive_action TEXT NULL,
    what TEXT NULL,
    why TEXT NULL,
    where_field TEXT NULL,
    when_deadline DATE NULL,
    who TEXT NULL,
    how TEXT NULL,
    how_much TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO',
    approved_by_id INT NULL,
    approved_at DATETIME(6) NULL,
    validated_by_id INT NULL,
    validated_at DATETIME(6) NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_tap_error (error_id),
    INDEX idx_tap_tutorado (tutorado_id),
    INDEX idx_tap_status (status),
    CONSTRAINT fk_tap_error FOREIGN KEY (error_id) REFERENCES tutoria_errors(id) ON DELETE CASCADE,
    CONSTRAINT fk_tap_creator FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tap_tutorado FOREIGN KEY (tutorado_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tap_approver FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_tap_validator FOREIGN KEY (validated_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.5 Ações individuais dos planos
CREATE TABLE IF NOT EXISTS tutoria_action_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'CORRETIVA',
    description TEXT NOT NULL,
    responsible_id INT NULL,
    due_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    evidence_text TEXT NULL,
    reviewer_comment TEXT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_tai_plan (plan_id),
    INDEX idx_tai_responsible (responsible_id),
    CONSTRAINT fk_tai_plan FOREIGN KEY (plan_id) REFERENCES tutoria_action_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_tai_responsible FOREIGN KEY (responsible_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.6 Comentários (erros e planos)
CREATE TABLE IF NOT EXISTS tutoria_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ref_type VARCHAR(20) NOT NULL COMMENT 'error | plan',
    ref_id INT NOT NULL,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_tc_ref (ref_type, ref_id),
    CONSTRAINT fk_tc_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.7 Fichas de aprendizagem (Tutoria)
CREATE TABLE IF NOT EXISTS tutoria_learning_sheets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    error_id INT NOT NULL,
    tutorado_id INT NOT NULL,
    created_by_id INT NOT NULL,
    title VARCHAR(300) NOT NULL,
    error_summary TEXT NOT NULL,
    root_cause TEXT NULL,
    correct_procedure TEXT NULL,
    key_learnings TEXT NULL,
    reference_material TEXT NULL,
    acknowledgment_note TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    read_at DATETIME NULL,
    acknowledged_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ls_error FOREIGN KEY (error_id) REFERENCES tutoria_errors(id) ON DELETE CASCADE,
    CONSTRAINT fk_ls_tutorado FOREIGN KEY (tutorado_id) REFERENCES users(id),
    CONSTRAINT fk_ls_creator FOREIGN KEY (created_by_id) REFERENCES users(id),
    INDEX idx_ls_error (error_id),
    INDEX idx_ls_tutorado (tutorado_id),
    INDEX idx_ls_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- SECÇÃO 7: ERROS INTERNOS (Sensos)
-- =====================================================================

SELECT '=== SECÇÃO 7: Erros Internos ===' AS progress;

-- 7.1 Sensos (períodos de censo)
CREATE TABLE IF NOT EXISTS sensos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    created_by_id INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.2 Erros internos
CREATE TABLE IF NOT EXISTS internal_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    senso_id INT NOT NULL,
    gravador_id INT NOT NULL,
    liberador_id INT NOT NULL,
    created_by_id INT NOT NULL,
    impact_id INT NULL,
    category_id INT NULL,
    error_type_id INT NULL,
    department_id INT NULL,
    activity_id INT NULL,
    bank_id INT NULL,
    description TEXT NOT NULL,
    reference_code VARCHAR(200) NULL,
    date_occurrence DATE NOT NULL,
    peso_liberador INT NULL,
    peso_gravador INT NULL,
    peso_tutor INT NULL,
    why_1 TEXT NULL,
    why_2 TEXT NULL,
    why_3 TEXT NULL,
    why_4 TEXT NULL,
    why_5 TEXT NULL,
    tutor_evaluation TEXT NULL,
    tutor_evaluated_by_id INT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (senso_id) REFERENCES sensos(id) ON DELETE CASCADE,
    FOREIGN KEY (gravador_id) REFERENCES users(id),
    FOREIGN KEY (liberador_id) REFERENCES users(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id),
    FOREIGN KEY (impact_id) REFERENCES error_impacts(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES tutoria_error_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (error_type_id) REFERENCES error_types(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL,
    FOREIGN KEY (tutor_evaluated_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.3 Classificações de erros internos (N por erro)
CREATE TABLE IF NOT EXISTS internal_error_classifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    internal_error_id INT NOT NULL,
    classification VARCHAR(50) NOT NULL COMMENT 'METHODOLOGY | KNOWLEDGE | DETAIL | PROCEDURE',
    description TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (internal_error_id) REFERENCES internal_errors(id) ON DELETE CASCADE,
    INDEX idx_iec_error (internal_error_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.4 Planos de ação de erros internos
CREATE TABLE IF NOT EXISTS internal_error_action_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    internal_error_id INT NOT NULL UNIQUE,
    created_by_id INT NOT NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (internal_error_id) REFERENCES internal_errors(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.5 Ações de planos de erros internos
CREATE TABLE IF NOT EXISTS internal_error_action_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'CORRETIVA',
    responsible_id INT NULL,
    due_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES internal_error_action_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (responsible_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.6 Fichas de aprendizagem (Erros Internos)
CREATE TABLE IF NOT EXISTS learning_sheets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    internal_error_id INT NOT NULL UNIQUE,
    tutorado_id INT NOT NULL,
    created_by_id INT NOT NULL,
    error_summary TEXT NOT NULL,
    impact_description TEXT NULL,
    actions_taken TEXT NULL,
    error_weight INT NULL,
    tutor_evaluation TEXT NULL,
    lessons_learned TEXT NULL,
    recommendations TEXT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (internal_error_id) REFERENCES internal_errors(id) ON DELETE CASCADE,
    FOREIGN KEY (tutorado_id) REFERENCES users(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- SECÇÃO 8: CHAMADOS (Portal de Suporte)
-- =====================================================================

SELECT '=== SECÇÃO 8: Chamados ===' AS progress;

-- 8.1 chamados
CREATE TABLE IF NOT EXISTS chamados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'BUG',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTO',
    portal VARCHAR(30) NOT NULL DEFAULT 'GERAL',
    created_by_id INT NOT NULL,
    assigned_to_id INT NULL,
    admin_notes TEXT NULL,
    attachments JSON NULL COMMENT 'Base64-encoded screenshots',
    completed_at DATETIME(6) NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (created_by_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_chamados_status (status),
    INDEX idx_chamados_type (type),
    INDEX idx_chamados_created_by (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Garante coluna attachments se tabela já existia
CALL add_column_if_not_exists('chamados', 'attachments', 'JSON NULL');

-- 8.2 chamado_comments
CREATE TABLE IF NOT EXISTS chamado_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chamado_id INT NOT NULL,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (chamado_id) REFERENCES chamados(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_cc_chamado (chamado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- SECÇÃO 9: CHATBOT FAQ
-- =====================================================================

SELECT '=== SECÇÃO 9: Chat FAQs ===' AS progress;

CREATE TABLE IF NOT EXISTS chat_faqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keywords_pt TEXT NOT NULL,
    keywords_es TEXT NULL,
    keywords_en TEXT NULL,
    answer_pt TEXT NOT NULL,
    answer_es TEXT NULL,
    answer_en TEXT NULL,
    support_url VARCHAR(500) NULL,
    support_label VARCHAR(200) NULL,
    role_filter VARCHAR(100) NULL COMMENT 'NULL = todos os roles',
    priority INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_id INT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_cf_active (is_active),
    INDEX idx_cf_priority (priority),
    CONSTRAINT fk_cf_creator FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- SECÇÃO 10: FOREIGN KEYS PARA COLUNAS ADICIONADAS (Secção 1)
-- =====================================================================

SELECT '=== SECÇÃO 10: Foreign keys ===' AS progress;

-- users
CALL add_fk_if_not_exists('fk_user_tutor', 'users', 'tutor_id', 'users', 'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_user_team',  'users', 'team_id',  'teams', 'id', 'SET NULL');

-- training_plans
CALL add_fk_if_not_exists('fk_tp_student',      'training_plans', 'student_id',   'users', 'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_tp_finalized_by', 'training_plans', 'finalized_by', 'users', 'id', 'SET NULL');

-- lesson_progress
CALL add_fk_if_not_exists('fk_lp_training_plan', 'lesson_progress', 'training_plan_id', 'training_plans', 'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_lp_user',          'lesson_progress', 'user_id',          'users',          'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_lp_released_by',   'lesson_progress', 'released_by',      'users',          'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_lp_finished_by',   'lesson_progress', 'finished_by',      'users',          'id', 'SET NULL');

-- challenges
CALL add_fk_if_not_exists('fk_ch_released_by', 'challenges', 'released_by', 'users', 'id', 'SET NULL');

-- challenge_submissions
CALL add_fk_if_not_exists('fk_cs_training_plan', 'challenge_submissions', 'training_plan_id', 'training_plans', 'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_cs_submitted_by',  'challenge_submissions', 'submitted_by',     'users',          'id', 'SET NULL');
CALL add_fk_if_not_exists('fk_cs_reviewed_by',   'challenge_submissions', 'reviewed_by',      'users',          'id', 'SET NULL');

-- training_plan_courses
CALL add_fk_if_not_exists('fk_tpc_finalized_by', 'training_plan_courses', 'finalized_by', 'users', 'id', 'SET NULL');


-- =====================================================================
-- SECÇÃO 11: ÍNDICES ADICIONAIS
-- =====================================================================

SELECT '=== SECÇÃO 11: Índices ===' AS progress;

-- lesson_progress
CALL add_index_if_not_exists('idx_lp_status',     'lesson_progress', '`status`');
CALL add_index_if_not_exists('idx_lp_is_released','lesson_progress', '`is_released`');
CALL add_index_if_not_exists('idx_lp_user',       'lesson_progress', '`user_id`');
CALL add_index_if_not_exists('idx_lp_plan',       'lesson_progress', '`training_plan_id`');

-- course_banks / course_products
CALL add_index_if_not_exists('idx_cb_course',  'course_banks',    '`course_id`');
CALL add_index_if_not_exists('idx_cb_bank',    'course_banks',    '`bank_id`');
CALL add_index_if_not_exists('idx_cp_course',  'course_products', '`course_id`');
CALL add_index_if_not_exists('idx_cp_product', 'course_products', '`product_id`');

-- training_plan_banks / products / trainers
CALL add_index_if_not_exists('idx_tpb_plan',    'training_plan_banks',    '`training_plan_id`');
CALL add_index_if_not_exists('idx_tpb_bank',    'training_plan_banks',    '`bank_id`');
CALL add_index_if_not_exists('idx_tpp_plan',    'training_plan_products', '`training_plan_id`');
CALL add_index_if_not_exists('idx_tpp_product', 'training_plan_products', '`product_id`');
CALL add_index_if_not_exists('idx_tpt_plan',    'training_plan_trainers', '`training_plan_id`');
CALL add_index_if_not_exists('idx_tpt_trainer', 'training_plan_trainers', '`trainer_id`');

-- training_plans / training_plan_courses status
CALL add_index_if_not_exists('idx_tp_status',  'training_plans',        '`status`');
CALL add_index_if_not_exists('idx_tpc_status', 'training_plan_courses', '`status`');

-- tutoria_errors extra
CALL add_index_if_not_exists('idx_te_product', 'tutoria_errors', '`product_id`');


-- =====================================================================
-- SECÇÃO 12: MIGRAÇÃO DE DADOS
-- =====================================================================

SELECT '=== SECÇÃO 12: Migração de dados ===' AS progress;

-- 12.1 Migrar bank/product de cursos únicos para tabelas multi
INSERT IGNORE INTO course_banks (course_id, bank_id)
SELECT id, bank_id FROM courses WHERE bank_id IS NOT NULL;

INSERT IGNORE INTO course_products (course_id, product_id)
SELECT id, product_id FROM courses WHERE product_id IS NOT NULL;

-- 12.2 Migrar bank/product de planos únicos para tabelas multi
INSERT IGNORE INTO training_plan_banks (training_plan_id, bank_id)
SELECT id, bank_id FROM training_plans WHERE bank_id IS NOT NULL;

INSERT IGNORE INTO training_plan_products (training_plan_id, product_id)
SELECT id, product_id FROM training_plans WHERE product_id IS NOT NULL;

-- 12.3 Migrar formador principal para tabela de múltiplos formadores
INSERT INTO training_plan_trainers (training_plan_id, trainer_id, is_primary, assigned_by)
SELECT id, trainer_id, 1, created_by
FROM training_plans
WHERE trainer_id IS NOT NULL
ON DUPLICATE KEY UPDATE is_primary = 1;

-- 12.4 Migrar student_id de training_plans para training_plan_assignments
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

-- 12.5 Atualizar assignments sem datas (copiar do plano)
UPDATE training_plan_assignments tpa
JOIN training_plans tp ON tp.id = tpa.training_plan_id
SET
    tpa.start_date = COALESCE(tpa.start_date, tp.start_date),
    tpa.end_date = COALESCE(tpa.end_date, tp.end_date),
    tpa.status = COALESCE(tpa.status, 'PENDING')
WHERE tpa.start_date IS NULL;

-- 12.6 Atualizar status de challenge_submissions existentes
UPDATE challenge_submissions
SET status = 'REVIEWED'
WHERE completed_at IS NOT NULL AND (status IS NULL OR status = 'IN_PROGRESS');

-- 12.7 Defaults para registos existentes
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

-- 12.8 Atualizar status calculado de lesson_progress
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


-- =====================================================================
-- SECÇÃO 13: DADOS INICIAIS (seed)
-- =====================================================================

SELECT '=== SECÇÃO 13: Dados iniciais ===' AS progress;

-- 13.1 Bancos
INSERT IGNORE INTO banks (code, name, country) VALUES
    ('PT', 'Portugal', 'Portugal'),
    ('ES', 'España', 'España'),
    ('UN', 'Universal', 'Global'),
    ('BSAN', 'BANCO SANTANDER', 'ES');

-- 13.2 Produtos
INSERT IGNORE INTO products (code, name) VALUES
    ('FX',    'Foreign Exchange'),
    ('MM',    'Money Market'),
    ('DERIV', 'Derivatives');

-- 13.3 Categorias de erro (se tabela estiver vazia)
INSERT INTO tutoria_error_categories (name, description, is_active)
SELECT src.name, src.description, 1 FROM (
    SELECT 'Processo'      AS name, 'Erros relacionados com processos e fluxos de trabalho' AS description UNION ALL
    SELECT 'Comunicação',           'Erros de comunicação interna ou com clientes'           UNION ALL
    SELECT 'Técnico',               'Erros técnicos ou de conhecimento especializado'        UNION ALL
    SELECT 'Documentação',          'Erros em preenchimento ou arquivo de documentos'        UNION ALL
    SELECT 'Atendimento',           'Erros no atendimento ao cliente ou parceiro'            UNION ALL
    SELECT 'Compliance',            'Erros de conformidade regulatória ou interna'           UNION ALL
    SELECT 'Qualidade',             'Erros de controlo de qualidade ou verificação'
) AS src
WHERE NOT EXISTS (SELECT 1 FROM tutoria_error_categories LIMIT 1);

-- 13.4 Impactos
INSERT IGNORE INTO error_impacts (name) VALUES ('Alto'), ('Baixo');

-- 13.5 Origens
INSERT IGNORE INTO error_origins (name) VALUES
    ('Interno'), ('Externo'), ('Cliente'), ('Regulador'), ('Proveedor'),
    ('Terceros'), ('Trade_Tecnología'), ('Trade_Procesos');

-- 13.6 Detetado por
INSERT IGNORE INTO error_detected_by (name) VALUES
    ('Autodetección'), ('Supervisor'), ('Auditoría'), ('Cliente'), ('Sistema'), ('Regulador');

-- 13.7 Departamentos
INSERT IGNORE INTO departments (name) VALUES
    ('Operaciones'), ('Compliance'), ('Riesgo'), ('Comercial'), ('Tecnología'), ('Back Office'),
    ('CDE'), ('CDI SAN'), ('CHEQUES EXTERIORES'), ('CONFIRMING'), ('CONTROL'), ('ESPANA'),
    ('FACTURACION'), ('FINANCIACION'), ('GARANTIAS'), ('GENERAL'), ('ONE-UK TRADE'), ('OPAGO'),
    ('PAGOS'), ('PROYECTOS'), ('PRUEBAS'), ('REM EXPORTACIONES'), ('REM IMPORTACIONES');

-- 13.8 Atividades
INSERT IGNORE INTO activities (name) VALUES
    ('Transferencias'), ('Cambio'), ('Pagamentos'), ('Compensación'),
    ('Liquidación'), ('Documentación'), ('Contabilidad');


-- =====================================================================
-- SECÇÃO 14: LIMPEZA
-- =====================================================================

SELECT '=== SECÇÃO 14: Limpeza ===' AS progress;

SET FOREIGN_KEY_CHECKS = 1;

DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DROP PROCEDURE IF EXISTS add_fk_if_not_exists;
DROP PROCEDURE IF EXISTS add_index_if_not_exists;
DROP PROCEDURE IF EXISTS safe_modify_column;


-- =====================================================================
-- CONCLUÍDO!
-- =====================================================================

SELECT '✅ Migração unificada FINAL concluída com sucesso!' AS resultado;
SELECT CONCAT('Base de dados: ', DATABASE()) AS info;
SELECT CONCAT('Data de execução: ', NOW()) AS info;

-- Resumo das tabelas
SELECT TABLE_NAME, TABLE_ROWS
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY TABLE_NAME;
