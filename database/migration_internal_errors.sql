-- Migration: Internal Errors System (Sensos, Erros Internos, Fichas de Aprendizagem)
-- Date: 2026-03-06

-- 1. Add is_liberador flag to users (ignore error if already exists)
-- ALTER TABLE users ADD COLUMN is_liberador BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add level and image_url to error_impacts (ignore if already exist)
-- ALTER TABLE error_impacts ADD COLUMN level VARCHAR(10) DEFAULT NULL;
-- ALTER TABLE error_impacts ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;

-- 3. Create sensos table
CREATE TABLE IF NOT EXISTS sensos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    created_by_id INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Create internal_errors table
CREATE TABLE IF NOT EXISTS internal_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    senso_id INT NOT NULL,
    gravador_id INT NOT NULL,
    liberador_id INT NOT NULL,
    created_by_id INT NOT NULL,
    impact_id INT DEFAULT NULL,
    category_id INT DEFAULT NULL,
    error_type_id INT DEFAULT NULL,
    department_id INT DEFAULT NULL,
    activity_id INT DEFAULT NULL,
    bank_id INT DEFAULT NULL,
    description TEXT NOT NULL,
    reference_code VARCHAR(200) DEFAULT NULL,
    date_occurrence DATE NOT NULL,
    peso_liberador INT DEFAULT NULL,
    peso_gravador INT DEFAULT NULL,
    peso_tutor INT DEFAULT NULL,
    why_1 TEXT DEFAULT NULL,
    why_2 TEXT DEFAULT NULL,
    why_3 TEXT DEFAULT NULL,
    why_4 TEXT DEFAULT NULL,
    why_5 TEXT DEFAULT NULL,
    tutor_evaluation TEXT DEFAULT NULL,
    tutor_evaluated_by_id INT DEFAULT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Create internal_error_action_plans table
CREATE TABLE IF NOT EXISTS internal_error_action_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    internal_error_id INT NOT NULL UNIQUE,
    created_by_id INT NOT NULL,
    description TEXT DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (internal_error_id) REFERENCES internal_errors(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Create internal_error_action_items table
CREATE TABLE IF NOT EXISTS internal_error_action_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'CORRETIVA',
    responsible_id INT DEFAULT NULL,
    due_date DATE DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES internal_error_action_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (responsible_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Create learning_sheets table
CREATE TABLE IF NOT EXISTS learning_sheets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    internal_error_id INT NOT NULL UNIQUE,
    tutorado_id INT NOT NULL,
    created_by_id INT NOT NULL,
    error_summary TEXT NOT NULL,
    impact_description TEXT DEFAULT NULL,
    actions_taken TEXT DEFAULT NULL,
    error_weight INT DEFAULT NULL,
    tutor_evaluation TEXT DEFAULT NULL,
    lessons_learned TEXT DEFAULT NULL,
    recommendations TEXT DEFAULT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (internal_error_id) REFERENCES internal_errors(id) ON DELETE CASCADE,
    FOREIGN KEY (tutorado_id) REFERENCES users(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
