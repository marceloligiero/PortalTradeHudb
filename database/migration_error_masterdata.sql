-- ============================================================
-- Migration: Novos dados mestres para erros + campos Access
-- ============================================================

-- 1. Tabelas de dados mestres
CREATE TABLE IF NOT EXISTS error_impacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS error_origins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS error_detected_by (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Novos campos na tabela tutoria_errors
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS date_detection DATE NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS date_solution DATE NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS bank_id INT NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS office VARCHAR(100) NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS reference_code VARCHAR(200) NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS amount DOUBLE NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS final_client VARCHAR(200) NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS impact_id INT NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS origin_id INT NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS detected_by_id INT NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS approver_id INT NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS department_id INT NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS activity_id INT NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS solution TEXT NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS action_plan_text TEXT NULL;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(30) NULL;

-- 3. Foreign keys
ALTER TABLE tutoria_errors ADD CONSTRAINT fk_error_bank FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL;
ALTER TABLE tutoria_errors ADD CONSTRAINT fk_error_impact FOREIGN KEY (impact_id) REFERENCES error_impacts(id) ON DELETE SET NULL;
ALTER TABLE tutoria_errors ADD CONSTRAINT fk_error_origin FOREIGN KEY (origin_id) REFERENCES error_origins(id) ON DELETE SET NULL;
ALTER TABLE tutoria_errors ADD CONSTRAINT fk_error_detected_by FOREIGN KEY (detected_by_id) REFERENCES error_detected_by(id) ON DELETE SET NULL;
ALTER TABLE tutoria_errors ADD CONSTRAINT fk_error_approver FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tutoria_errors ADD CONSTRAINT fk_error_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE tutoria_errors ADD CONSTRAINT fk_error_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL;

-- 4. Dados iniciais
INSERT IGNORE INTO error_impacts (name) VALUES
    ('Alto'), ('Baixo');

INSERT IGNORE INTO error_origins (name) VALUES
    ('Interno'), ('Externo'), ('Cliente'), ('Regulador'), ('Proveedor');

INSERT IGNORE INTO error_detected_by (name) VALUES
    ('Autodetección'), ('Supervisor'), ('Auditoría'), ('Cliente'), ('Sistema'), ('Regulador');

INSERT IGNORE INTO departments (name) VALUES
    ('Operaciones'), ('Compliance'), ('Riesgo'), ('Comercial'), ('Tecnología'), ('Back Office');

INSERT IGNORE INTO activities (name) VALUES
    ('Transferencias'), ('Cambio'), ('Pagamentos'), ('Compensación'), ('Liquidación'), ('Documentación'), ('Contabilidad');
