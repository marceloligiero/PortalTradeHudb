-- V003 — Cápsulas Formativas (C.1), Side by Side (C.2), Feedback dos Liberadores (B)
-- Applied automatically on backend startup via migrate.py
-- Note: no IF NOT EXISTS on ALTER TABLE — migrate.py handles "duplicate column" errors

-- ─── C.1: Cápsulas Formativas ─────────────────────────────────────────────────
ALTER TABLE courses ADD COLUMN course_type VARCHAR(30) NOT NULL DEFAULT 'CURSO' COMMENT 'CURSO | CAPSULA_METODOLOGIA | CAPSULA_FUNCIONALIDADE';
ALTER TABLE courses ADD COLUMN managed_by_tutor BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Se TRUE, utilizadores com is_tutor podem fazer CRUD neste curso/cápsula';

-- ─── C.2: Side by Side / Planos de Seguimento ────────────────────────────────
ALTER TABLE tutoria_action_plans ADD COLUMN side_by_side BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'TRUE = observação direta (Side by Side)';
ALTER TABLE tutoria_action_plans ADD COLUMN observation_date DATE NULL COMMENT 'Data da sessão de observação Side by Side';
ALTER TABLE tutoria_action_plans ADD COLUMN observation_notes TEXT NULL COMMENT 'Notas de observação do tutor durante o Side by Side';

-- ─── B: Feedback dos Liberadores ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS releaser_surveys (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200)  NOT NULL,
    week_start      DATE          NOT NULL COMMENT 'Início da semana de referência',
    week_end        DATE          NOT NULL COMMENT 'Fim da semana de referência',
    created_by_id   INT           NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN | CLOSED',
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rs_creator FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS releaser_survey_responses (
    id                          INT AUTO_INCREMENT PRIMARY KEY,
    survey_id                   INT           NOT NULL,
    liberador_id                INT           NOT NULL,
    grabador_id                 INT           NOT NULL,
    opinion                     TEXT          NULL  COMMENT 'Opinião geral do liberador sobre o gravador',
    sentiment                   VARCHAR(20)   NULL  COMMENT 'POSITIVE | NEUTRAL | NEGATIVE',
    concrete_situations         TEXT          NULL  COMMENT 'Situações concretas observadas',
    needs_tutor_intervention    BOOLEAN       NOT NULL DEFAULT FALSE,
    submitted_at                TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rsr_survey    FOREIGN KEY (survey_id)    REFERENCES releaser_surveys(id) ON DELETE CASCADE,
    CONSTRAINT fk_rsr_liberador FOREIGN KEY (liberador_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_rsr_grabador  FOREIGN KEY (grabador_id)  REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_response (survey_id, liberador_id, grabador_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS releaser_survey_actions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    response_id     INT           NOT NULL,
    action_type     VARCHAR(50)   NULL  COMMENT 'FEEDBACK_DIRETO | TUTORIA | SEGUIMENTO | OUTRO',
    description     TEXT          NULL,
    created_by_id   INT           NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rsa_response FOREIGN KEY (response_id)   REFERENCES releaser_survey_responses(id) ON DELETE CASCADE,
    CONSTRAINT fk_rsa_creator  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
