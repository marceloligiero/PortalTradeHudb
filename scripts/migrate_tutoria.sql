-- =============================================================================
-- Migração: Portal de Tutoria
-- Base de dados: tradehub
-- Descrição: Adiciona as tabelas do Portal de Tutoria (erros internos, planos
--            de ação e registo de sessões de erros por equipa)
-- Executar em: MySQL 8.x
-- Autor: Portal TradeHub
-- Data: 2026-02-27
-- =============================================================================
-- INSTRUÇÕES:
--   mysql -u root tradehub < migrate_tutoria.sql
-- =============================================================================

USE tradehub;

-- ─── 1. tutoria_errors ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutoria_errors (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255)    NOT NULL,
    description TEXT            NULL,
    reported_by INT             NULL,
    status      VARCHAR(50)     NOT NULL DEFAULT 'OPEN',
    category    VARCHAR(50)     NULL,         -- PROCEDURE, METHODOLOGY, KNOWLEDGE, DETAIL
    created_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)     NULL ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_tutoria_errors_user
        FOREIGN KEY (reported_by) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 2. tutoria_action_plans ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutoria_action_plans (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    error_id    INT             NOT NULL,
    title       VARCHAR(255)    NOT NULL,
    description TEXT            NULL,
    assigned_to INT             NULL,
    due_date    DATETIME(6)     NULL,
    status      VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    created_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)     NULL ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_tutoria_ap_error
        FOREIGN KEY (error_id) REFERENCES tutoria_errors(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tutoria_ap_user
        FOREIGN KEY (assigned_to) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 3. tutoria_plans ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutoria_plans (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255)    NOT NULL,
    description TEXT            NULL,
    created_by  INT             NULL,
    created_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)     NULL ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_tutoria_plans_user
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 4. tutoria_sessions ─────────────────────────────────────────────────────
-- Cabeçalho de cada sessão de registo de erros internos
CREATE TABLE IF NOT EXISTS tutoria_sessions (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    session_date DATETIME(6)     NOT NULL,
    reviewer_id  INT             NULL,    -- Revisor (formador/admin)
    recorder_id  INT             NULL,    -- Grabador (formando que cometeu os erros)
    department   VARCHAR(255)    NULL,    -- Departamento
    bank         VARCHAR(255)    NULL,    -- Banco
    activity     VARCHAR(255)    NULL,    -- Actividad
    reference    VARCHAR(255)    NULL,    -- Referência interna
    created_by   INT             NOT NULL,
    created_at   DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at   DATETIME(6)     NULL ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_tsessions_reviewer
        FOREIGN KEY (reviewer_id) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_tsessions_recorder
        FOREIGN KEY (recorder_id) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_tsessions_creator
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 5. tutoria_session_errors ───────────────────────────────────────────────
-- Cada linha de erro individual associada a uma sessão
CREATE TABLE IF NOT EXISTS tutoria_session_errors (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    session_id   INT             NOT NULL,
    order_index  INT             NOT NULL DEFAULT 1,
    enabled      TINYINT(1)      NOT NULL DEFAULT 1,
    typology     VARCHAR(50)     NULL,    -- KNOWLEDGE, METHODOLOGY, DETAIL, PROCEDURE
    error_type   VARCHAR(255)    NULL,    -- Sub-tipo de erro
    observations TEXT            NULL,
    created_at   DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_tse_session
        FOREIGN KEY (session_id) REFERENCES tutoria_sessions(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Índices de performance ──────────────────────────────────────────────────
-- Nota: CREATE INDEX não tem IF NOT EXISTS no MySQL — as tabelas são novas,
--       por isso os índices ainda não existem.
CREATE INDEX idx_tutoria_errors_status
    ON tutoria_errors(status);

CREATE INDEX idx_tutoria_ap_error
    ON tutoria_action_plans(error_id);

CREATE INDEX idx_tutoria_ap_assigned
    ON tutoria_action_plans(assigned_to);

CREATE INDEX idx_tutoria_sessions_date
    ON tutoria_sessions(session_date);

CREATE INDEX idx_tutoria_se_session
    ON tutoria_session_errors(session_id);

-- ─── Verificação final ───────────────────────────────────────────────────────
SELECT
    table_name      AS `Tabela criada`,
    table_rows      AS `Linhas (aprox.)`,
    create_time     AS `Criada em`
FROM information_schema.tables
WHERE table_schema = 'tradehub'
  AND table_name IN (
      'tutoria_errors',
      'tutoria_action_plans',
      'tutoria_plans',
      'tutoria_sessions',
      'tutoria_session_errors'
  )
ORDER BY table_name;
