-- =============================================================
-- Migração Tutoria V4 — Sistema de Incidências Completo
-- Aditiva: apenas ADD COLUMN / CREATE TABLE IF NOT EXISTS
-- =============================================================

-- ── 1. Users: novos campos de perfil ──
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_team_lead TINYINT(1) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_referente TINYINT(1) DEFAULT 0;

-- ── 2. TutoriaError: campos de análise ──
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS impact_level VARCHAR(20);
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS impact_detail VARCHAR(100);
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS origin_detail VARCHAR(100);
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS grabador_id INT REFERENCES users(id);
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS liberador_id INT REFERENCES users(id);
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS solution_confirmed TINYINT(1) DEFAULT 0;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS pending_solution TINYINT(1) DEFAULT 0;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS excel_sent TINYINT(1) DEFAULT 0;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS action_plan_summary TEXT;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;
ALTER TABLE tutoria_errors ADD COLUMN IF NOT EXISTS cancelled_by_id INT REFERENCES users(id);

-- ── 3. TutoriaErrorRef: refs múltiplas por erro ──
CREATE TABLE IF NOT EXISTS tutoria_error_refs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    error_id INT NOT NULL,
    referencia VARCHAR(100),
    divisa VARCHAR(20),
    importe DECIMAL(18,2),
    cliente_final VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_error_ref_error FOREIGN KEY (error_id) REFERENCES tutoria_errors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. TutoriaActionPlan: campos adicionais ──
ALTER TABLE tutoria_action_plans ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20);
ALTER TABLE tutoria_action_plans ADD COLUMN IF NOT EXISTS responsible_id INT REFERENCES users(id);
ALTER TABLE tutoria_action_plans ADD COLUMN IF NOT EXISTS expected_result TEXT;
ALTER TABLE tutoria_action_plans ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE tutoria_action_plans ADD COLUMN IF NOT EXISTS result_score INT;
ALTER TABLE tutoria_action_plans ADD COLUMN IF NOT EXISTS result_comment VARCHAR(160);
ALTER TABLE tutoria_action_plans ADD COLUMN IF NOT EXISTS started_at DATETIME;
ALTER TABLE tutoria_action_plans ADD COLUMN IF NOT EXISTS completed_at DATETIME;

-- ── 5. Notificações ──
CREATE TABLE IF NOT EXISTS tutoria_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    error_id INT,
    plan_id INT,
    type VARCHAR(50) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_notif_error FOREIGN KEY (error_id) REFERENCES tutoria_errors(id) ON DELETE SET NULL,
    CONSTRAINT fk_notif_plan FOREIGN KEY (plan_id) REFERENCES tutoria_action_plans(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. TutoriaLearningSheet: campos para reflexão/revisão ──
ALTER TABLE tutoria_learning_sheets ADD COLUMN IF NOT EXISTS reflection TEXT;
ALTER TABLE tutoria_learning_sheets ADD COLUMN IF NOT EXISTS submitted_at DATETIME;
ALTER TABLE tutoria_learning_sheets ADD COLUMN IF NOT EXISTS tutor_id INT REFERENCES users(id);
ALTER TABLE tutoria_learning_sheets ADD COLUMN IF NOT EXISTS tutor_outcome VARCHAR(30);
ALTER TABLE tutoria_learning_sheets ADD COLUMN IF NOT EXISTS tutor_notes TEXT;
ALTER TABLE tutoria_learning_sheets ADD COLUMN IF NOT EXISTS reviewed_at DATETIME;
ALTER TABLE tutoria_learning_sheets ADD COLUMN IF NOT EXISTS is_mandatory TINYINT(1) DEFAULT 0;

-- ── 7. Índices ──
CREATE INDEX IF NOT EXISTS idx_notif_user_read ON tutoria_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_error_refs_error ON tutoria_error_refs(error_id);
CREATE INDEX IF NOT EXISTS idx_error_status ON tutoria_errors(status);
