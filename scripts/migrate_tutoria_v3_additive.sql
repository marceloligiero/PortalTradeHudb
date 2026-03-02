-- =============================================================================
-- Migração v3 (aditiva): Portal de Gestão de Erros e Planos de Ação
-- Base de dados: tradehub (MySQL 8.x)
-- Apenas cria tabelas NOVAS do Portal Tutoria.
-- Não toca em nenhuma tabela existente do portal de formações.
-- Instrução: mysql -u root tradehub < migrate_tutoria_v3_additive.sql
-- =============================================================================

USE tradehub;

SET FOREIGN_KEY_CHECKS = 0;

-- ─── 1. Coluna tutor_id na tabela users (se ainda não existir) ────────────
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'users'
      AND COLUMN_NAME  = 'tutor_id'
);
SET @sql_col = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN tutor_id INT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql_col; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK tutor_id → users(id)
SET @fk_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'users'
      AND CONSTRAINT_NAME = 'fk_user_tutor'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_fk = IF(@fk_exists = 0,
    'ALTER TABLE users ADD CONSTRAINT fk_user_tutor FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── 2. Categorias de Erro ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutoria_error_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    description TEXT            NULL,
    parent_id   INT             NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX idx_tec_parent (parent_id),
    CONSTRAINT fk_tec_parent
        FOREIGN KEY (parent_id) REFERENCES tutoria_error_categories(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed de categorias (só insere se a tabela estiver vazia)
INSERT INTO tutoria_error_categories (name, description)
SELECT src.name, src.description FROM (
    SELECT 'Processo'      AS name, 'Erros relacionados com processos e fluxos de trabalho' AS description UNION ALL
    SELECT 'Comunicação',           'Erros de comunicação interna ou com clientes'          UNION ALL
    SELECT 'Técnico',               'Erros técnicos ou de conhecimento especializado'       UNION ALL
    SELECT 'Documentação',          'Erros em preenchimento ou arquivo de documentos'       UNION ALL
    SELECT 'Atendimento',           'Erros no atendimento ao cliente ou parceiro'           UNION ALL
    SELECT 'Compliance',            'Erros de conformidade regulatória ou interna'          UNION ALL
    SELECT 'Qualidade',             'Erros de controlo de qualidade ou verificação'
) AS src
WHERE NOT EXISTS (SELECT 1 FROM tutoria_error_categories LIMIT 1);

-- ─── 3. Erros ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutoria_errors (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    date_occurrence     DATE            NOT NULL,
    description         TEXT            NOT NULL,
    tutorado_id         INT             NOT NULL,
    created_by_id       INT             NOT NULL,
    category_id         INT             NULL,
    severity            VARCHAR(20)     NOT NULL DEFAULT 'MEDIA',
    status              VARCHAR(30)     NOT NULL DEFAULT 'ABERTO',
    tags                JSON            NULL,
    analysis_5_why      TEXT            NULL,
    is_recurrent        TINYINT(1)      NOT NULL DEFAULT 0,
    recurrence_count    INT             NOT NULL DEFAULT 0,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    inactivation_reason TEXT            NULL,
    created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)     NULL ON UPDATE CURRENT_TIMESTAMP(6),

    INDEX idx_te_tutorado  (tutorado_id),
    INDEX idx_te_category  (category_id),
    INDEX idx_te_status    (status),
    INDEX idx_te_severity  (severity),
    INDEX idx_te_recurrent (is_recurrent),

    CONSTRAINT fk_te_tutorado  FOREIGN KEY (tutorado_id)  REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_te_creator   FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_te_category  FOREIGN KEY (category_id)  REFERENCES tutoria_error_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 4. Planos de Ação ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutoria_action_plans (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    error_id             INT             NOT NULL,
    created_by_id        INT             NOT NULL,
    tutorado_id          INT             NOT NULL,

    analysis_5_why       TEXT            NULL,
    immediate_correction TEXT            NULL,
    corrective_action    TEXT            NULL,
    preventive_action    TEXT            NULL,

    what                 TEXT            NULL,
    why                  TEXT            NULL,
    where_field          TEXT            NULL,
    when_deadline        DATE            NULL,
    who                  TEXT            NULL,
    how                  TEXT            NULL,
    how_much             TEXT            NULL,

    status               VARCHAR(30)     NOT NULL DEFAULT 'RASCUNHO',
    approved_by_id       INT             NULL,
    approved_at          DATETIME(6)     NULL,
    validated_by_id      INT             NULL,
    validated_at         DATETIME(6)     NULL,

    created_at           DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at           DATETIME(6)     NULL ON UPDATE CURRENT_TIMESTAMP(6),

    INDEX idx_tap_error    (error_id),
    INDEX idx_tap_tutorado (tutorado_id),
    INDEX idx_tap_status   (status),

    CONSTRAINT fk_tap_error     FOREIGN KEY (error_id)       REFERENCES tutoria_errors(id)       ON DELETE CASCADE,
    CONSTRAINT fk_tap_creator   FOREIGN KEY (created_by_id)  REFERENCES users(id)               ON DELETE RESTRICT,
    CONSTRAINT fk_tap_tutorado  FOREIGN KEY (tutorado_id)    REFERENCES users(id)               ON DELETE RESTRICT,
    CONSTRAINT fk_tap_approver  FOREIGN KEY (approved_by_id)  REFERENCES users(id)              ON DELETE SET NULL,
    CONSTRAINT fk_tap_validator FOREIGN KEY (validated_by_id) REFERENCES users(id)              ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 5. Ações Individuais do Plano ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutoria_action_items (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    plan_id          INT         NOT NULL,
    type             VARCHAR(20) NOT NULL DEFAULT 'CORRETIVA',
    description      TEXT        NOT NULL,
    responsible_id   INT         NULL,
    due_date         DATE        NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    evidence_text    TEXT        NULL,
    reviewer_comment TEXT        NULL,
    created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),

    INDEX idx_tai_plan        (plan_id),
    INDEX idx_tai_responsible (responsible_id),

    CONSTRAINT fk_tai_plan        FOREIGN KEY (plan_id)        REFERENCES tutoria_action_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_tai_responsible FOREIGN KEY (responsible_id) REFERENCES users(id)               ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 6. Comentários ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutoria_comments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    ref_type   VARCHAR(20) NOT NULL,
    ref_id     INT         NOT NULL,
    author_id  INT         NOT NULL,
    content    TEXT        NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX idx_tc_ref (ref_type, ref_id),

    CONSTRAINT fk_tc_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ─── 7. Verificação final ─────────────────────────────────────────────────
SELECT table_name AS `Tabela criada`, create_time AS `Em`
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
      'tutoria_error_categories', 'tutoria_errors',
      'tutoria_action_plans', 'tutoria_action_items', 'tutoria_comments'
  )
ORDER BY table_name;

SELECT column_name AS `Coluna`, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name   = 'users'
  AND column_name  = 'tutor_id';

SELECT 'Migração v3 concluída.' AS resultado;
