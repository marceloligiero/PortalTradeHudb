-- ══════════════════════════════════════════════════════════════
-- DATA WAREHOUSE — Star Schema for TradeDataHub
-- Dimensions + Facts tables (prefix: dw_)
-- ══════════════════════════════════════════════════════════════

-- ── DIMENSIONS ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dw_dim_date (
    date_key INT PRIMARY KEY,          -- YYYYMMDD
    full_date DATE NOT NULL UNIQUE,
    year INT NOT NULL,
    quarter INT NOT NULL,
    month INT NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    week INT NOT NULL,
    day_of_month INT NOT NULL,
    day_of_week INT NOT NULL,          -- 0=Monday
    day_name VARCHAR(20) NOT NULL,
    is_weekend BOOLEAN NOT NULL DEFAULT FALSE,
    year_month VARCHAR(7) NOT NULL,    -- '2025-04'
    INDEX idx_dw_date_year_month (year_month),
    INDEX idx_dw_date_year (year),
    INDEX idx_dw_date_full (full_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dw_dim_user (
    user_key INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    team_name VARCHAR(200),
    team_id INT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_trainer BOOLEAN NOT NULL DEFAULT FALSE,
    is_tutor BOOLEAN NOT NULL DEFAULT FALSE,
    loaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_dw_user (user_id),
    INDEX idx_dw_user_role (role),
    INDEX idx_dw_user_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dw_dim_course (
    course_key INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    level VARCHAR(20),
    total_lessons INT NOT NULL DEFAULT 0,
    total_challenges INT NOT NULL DEFAULT 0,
    trainer_name VARCHAR(255),
    trainer_id INT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    loaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_dw_course (course_id),
    INDEX idx_dw_course_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dw_dim_error_category (
    category_key INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    parent_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    loaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_dw_error_cat (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dw_dim_team (
    team_key INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    manager_name VARCHAR(255),
    total_members INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    loaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_dw_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dw_dim_status (
    status_key INT PRIMARY KEY AUTO_INCREMENT,
    domain VARCHAR(50) NOT NULL,       -- TUTORIA, CHAMADOS, TRAINING_PLAN, etc.
    status_code VARCHAR(50) NOT NULL,
    status_label VARCHAR(100) NOT NULL,
    loaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_dw_status (domain, status_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── FACTS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dw_fact_training (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date_key INT NOT NULL,
    user_key INT NOT NULL,
    course_key INT NOT NULL,
    certificate_id INT,
    training_plan_id INT,
    days_to_complete INT,
    total_hours FLOAT DEFAULT 0,
    courses_completed INT DEFAULT 0,
    average_mpu FLOAT DEFAULT 0,
    average_approval_rate FLOAT DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ft_date (date_key),
    INDEX idx_ft_user (user_key),
    INDEX idx_ft_course (course_key),
    FOREIGN KEY (date_key) REFERENCES dw_dim_date(date_key),
    FOREIGN KEY (user_key) REFERENCES dw_dim_user(user_key),
    FOREIGN KEY (course_key) REFERENCES dw_dim_course(course_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dw_fact_tutoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date_key INT NOT NULL,
    student_key INT NOT NULL,
    trainer_key INT,
    category_key INT,
    status_key INT,
    error_id INT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    days_to_resolve INT,
    comments_count INT DEFAULT 0,
    action_items_count INT DEFAULT 0,
    action_items_completed INT DEFAULT 0,
    impact_level VARCHAR(20),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ftut_date (date_key),
    INDEX idx_ftut_student (student_key),
    INDEX idx_ftut_category (category_key),
    FOREIGN KEY (date_key) REFERENCES dw_dim_date(date_key),
    FOREIGN KEY (student_key) REFERENCES dw_dim_user(user_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dw_fact_chamados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date_key INT NOT NULL,
    creator_key INT NOT NULL,
    assignee_key INT,
    status_key INT,
    chamado_id INT NOT NULL,
    type VARCHAR(20),
    priority VARCHAR(20),
    is_resolved BOOLEAN DEFAULT FALSE,
    days_to_resolve INT,
    comments_count INT DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fch_date (date_key),
    INDEX idx_fch_creator (creator_key),
    FOREIGN KEY (date_key) REFERENCES dw_dim_date(date_key),
    FOREIGN KEY (creator_key) REFERENCES dw_dim_user(user_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dw_fact_internal_errors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date_key INT NOT NULL,
    reporter_key INT NOT NULL,
    gravador_key INT NOT NULL,
    liberador_key INT NOT NULL,
    status_key INT,
    internal_error_id INT NOT NULL,
    has_learning_sheet BOOLEAN DEFAULT FALSE,
    has_action_plan BOOLEAN DEFAULT FALSE,
    peso_tutor INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fie_date (date_key),
    INDEX idx_fie_reporter (reporter_key),
    FOREIGN KEY (date_key) REFERENCES dw_dim_date(date_key),
    FOREIGN KEY (reporter_key) REFERENCES dw_dim_user(user_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dw_fact_daily_snapshot (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date_key INT NOT NULL,
    -- Users
    total_users INT DEFAULT 0,
    active_users INT DEFAULT 0,
    users_by_role_admin INT DEFAULT 0,
    users_by_role_trainer INT DEFAULT 0,
    users_by_role_student INT DEFAULT 0,
    users_by_role_manager INT DEFAULT 0,
    -- Training
    total_courses INT DEFAULT 0,
    total_enrollments INT DEFAULT 0,
    certificates_today INT DEFAULT 0,
    certificates_mtd INT DEFAULT 0,
    certificates_total INT DEFAULT 0,
    -- Tutoria
    errors_open INT DEFAULT 0,
    errors_created_today INT DEFAULT 0,
    errors_resolved_today INT DEFAULT 0,
    errors_total INT DEFAULT 0,
    avg_resolution_days FLOAT DEFAULT 0,
    -- Chamados
    tickets_open INT DEFAULT 0,
    tickets_created_today INT DEFAULT 0,
    tickets_resolved_today INT DEFAULT 0,
    tickets_total INT DEFAULT 0,
    -- Internal errors
    internal_errors_total INT DEFAULT 0,
    internal_errors_pending INT DEFAULT 0,
    learning_sheets_total INT DEFAULT 0,
    -- Challenges
    challenges_total INT DEFAULT 0,
    submissions_today INT DEFAULT 0,
    submissions_approved_rate FLOAT DEFAULT 0,
    -- Snapshot metadata
    snapshot_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_snapshot_date (date_key),
    INDEX idx_snap_date (date_key),
    FOREIGN KEY (date_key) REFERENCES dw_dim_date(date_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── SEED STATUS DIMENSION ───────────────────────────────────

INSERT IGNORE INTO dw_dim_status (domain, status_code, status_label) VALUES
('TUTORIA', 'REGISTERED', 'Registado'),
('TUTORIA', 'IN_PROGRESS', 'Em Progresso'),
('TUTORIA', 'COMPLETED', 'Concluído'),
('TUTORIA', 'DELAYED', 'Atrasado'),
('CHAMADOS', 'ABERTO', 'Aberto'),
('CHAMADOS', 'EM_ANDAMENTO', 'Em Andamento'),
('CHAMADOS', 'EM_REVISAO', 'Em Revisão'),
('CHAMADOS', 'CONCLUIDO', 'Concluído'),
('TRAINING_PLAN', 'PENDING', 'Pendente'),
('TRAINING_PLAN', 'IN_PROGRESS', 'Em Progresso'),
('TRAINING_PLAN', 'COMPLETED', 'Concluído'),
('TRAINING_PLAN', 'DELAYED', 'Atrasado'),
('INTERNAL_ERROR', 'PENDENTE', 'Pendente'),
('INTERNAL_ERROR', 'AGUARDANDO_GRAVADOR', 'Aguardando Gravador'),
('INTERNAL_ERROR', 'AVALIADO', 'Avaliado'),
('INTERNAL_ERROR', 'PLANO_CRIADO', 'Plano Criado'),
('INTERNAL_ERROR', 'CONCLUIDO', 'Concluído');
