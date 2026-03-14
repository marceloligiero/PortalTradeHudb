-- =============================================================================
-- Migração v2: Portal de Gestão de Erros e Planos de Ação
-- Base de dados: tradehub
-- Descrição: Refatoração completa do Portal de Tutoria
--            → Remove tabelas antigas de sessões
--            → Recria tutoria_errors e tutoria_action_plans com novos campos
--            → Cria tutoria_error_categories, tutoria_action_items, tutoria_comments
--            → Adiciona tutor_id na tabela users
-- Executar em: MySQL 8.x
-- Instrução: mysql -u root tradehub < migrate_tutoria_v2.sql
-- =============================================================================

USE tradehub;

-- ─── 0. Desactivar FK checks temporariamente ──────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;

-- ─── 1. Remover tabelas antigas ───────────────────────────────────────────────
DROP TABLE IF EXISTS tutoria_session_errors;
DROP TABLE IF EXISTS tutoria_sessions;
DROP TABLE IF EXISTS tutoria_plans;
DROP TABLE IF EXISTS tutoria_action_plans;
DROP TABLE IF EXISTS tutoria_errors;
DROP TABLE IF EXISTS tutoria_error_categories;
DROP TABLE IF EXISTS tutoria_action_items;
DROP TABLE IF EXISTS tutoria_comments;

-- ─── 2. Coluna tutor_id na tabela users ───────────────────────────────────────
-- Liga tutorados (STUDENT/TRAINEE) ao seu tutor (TRAINER)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS tutor_id INT NULL,
    ADD CONSTRAINT fk_user_tutor
        FOREIGN KEY IF NOT EXISTS (tutor_id) REFERENCES users(id)
        ON DELETE SET NULL;

-- ─── 3. Categorias de Erro ────────────────────────────────────────────────────
CREATE TABLE tutoria_error_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    description TEXT            NULL,
    parent_id   INT             NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_tec_parent
        FOREIGN KEY (parent_id) REFERENCES tutoria_error_categories(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed com categorias base
INSERT INTO tutoria_error_categories (name, description) VALUES
    ('Processo',       'Erros relacionados com processos e fluxos de trabalho'),
    ('Comunicação',    'Erros de comunicação interna ou com clientes'),
    ('Técnico',        'Erros técnicos ou de conhecimento especializado'),
    ('Documentação',   'Erros em preenchimento ou arquivo de documentos'),
    ('Atendimento',    'Erros no atendimento ao cliente ou parceiro'),
    ('Compliance',     'Erros de conformidade regulatória ou interna'),
    ('Qualidade',      'Erros de controlo de qualidade ou verificação');

-- ─── 4. Erros ─────────────────────────────────────────────────────────────────
CREATE TABLE tutoria_errors (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    date_occurrence     DATE            NOT NULL,
    description         TEXT            NOT NULL,
    tutorado_id         INT             NOT NULL,
    created_by_id       INT             NOT NULL,
    category_id         INT             NULL,
    severity            VARCHAR(20)     NOT NULL DEFAULT 'MEDIA',
    -- BAIXA | MEDIA | ALTA | CRITICA
    status              VARCHAR(30)     NOT NULL DEFAULT 'ABERTO',
    -- ABERTO | EM_ANALISE | PLANO_CRIADO | EM_EXECUCAO | CONCLUIDO | VERIFICADO
    tags                JSON            NULL,
    analysis_5_why      TEXT            NULL,
    is_recurrent        TINYINT(1)      NOT NULL DEFAULT 0,
    recurrence_count    INT             NOT NULL DEFAULT 0,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    inactivation_reason TEXT            NULL,
    created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)     NULL ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_te_tutorado
        FOREIGN KEY (tutorado_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_te_creator
        FOREIGN KEY (created_by_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_te_category
        FOREIGN KEY (category_id) REFERENCES tutoria_error_categories(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 5. Planos de Ação ────────────────────────────────────────────────────────
CREATE TABLE tutoria_action_plans (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    error_id            INT             NOT NULL,
    created_by_id       INT             NOT NULL,
    tutorado_id         INT             NOT NULL,

    -- Análise de Causa Raiz
    analysis_5_why      TEXT            NULL,

    -- Ações principais
    immediate_correction TEXT           NULL,   -- Correção imediata
    corrective_action    TEXT           NULL,   -- Ação corretiva
    preventive_action    TEXT           NULL,   -- Ação preventiva

    -- 5W2H
    what                TEXT            NULL,
    why                 TEXT            NULL,
    where_field         TEXT            NULL,
    when_deadline       DATE            NULL,
    who                 TEXT            NULL,
    how                 TEXT            NULL,
    how_much            TEXT            NULL,

    -- Fluxo de aprovação
    status              VARCHAR(30)     NOT NULL DEFAULT 'RASCUNHO',
    -- RASCUNHO | AGUARDANDO_APROVACAO | APROVADO | EM_EXECUCAO | CONCLUIDO | DEVOLVIDO
    approved_by_id      INT             NULL,
    approved_at         DATETIME(6)     NULL,
    validated_by_id     INT             NULL,
    validated_at        DATETIME(6)     NULL,

    created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)     NULL ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_tap_error
        FOREIGN KEY (error_id) REFERENCES tutoria_errors(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tap_creator
        FOREIGN KEY (created_by_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_tap_tutorado
        FOREIGN KEY (tutorado_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_tap_approver
        FOREIGN KEY (approved_by_id) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_tap_validator
        FOREIGN KEY (validated_by_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 6. Ações Individuais do Plano ───────────────────────────────────────────
CREATE TABLE tutoria_action_items (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    plan_id             INT             NOT NULL,
    type                VARCHAR(20)     NOT NULL DEFAULT 'CORRETIVA',
    -- IMEDIATA | CORRETIVA | PREVENTIVA
    description         TEXT            NOT NULL,
    responsible_id      INT             NULL,
    due_date            DATE            NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDENTE',
    -- PENDENTE | EM_ANDAMENTO | CONCLUIDO | DEVOLVIDO
    evidence_text       TEXT            NULL,
    reviewer_comment    TEXT            NULL,
    created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)     NULL ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_tai_plan
        FOREIGN KEY (plan_id) REFERENCES tutoria_action_plans(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tai_responsible
        FOREIGN KEY (responsible_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 7. Comentários ──────────────────────────────────────────────────────────
CREATE TABLE tutoria_comments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    ref_type    VARCHAR(20)     NOT NULL,
    -- ERROR | PLAN | ACTION_ITEM
    ref_id      INT             NOT NULL,
    author_id   INT             NOT NULL,
    content     TEXT            NOT NULL,
    created_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_tc_author
        FOREIGN KEY (author_id) REFERENCES users(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 8. Reactivar FK checks ───────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 1;

-- ─── 9. Índices de performance ────────────────────────────────────────────────
CREATE INDEX idx_te_tutorado      ON tutoria_errors(tutorado_id);
CREATE INDEX idx_te_category      ON tutoria_errors(category_id);
CREATE INDEX idx_te_status        ON tutoria_errors(status);
CREATE INDEX idx_te_severity      ON tutoria_errors(severity);
CREATE INDEX idx_te_recurrent     ON tutoria_errors(is_recurrent);

CREATE INDEX idx_tap_error        ON tutoria_action_plans(error_id);
CREATE INDEX idx_tap_tutorado     ON tutoria_action_plans(tutorado_id);
CREATE INDEX idx_tap_status       ON tutoria_action_plans(status);

CREATE INDEX idx_tai_plan         ON tutoria_action_items(plan_id);
CREATE INDEX idx_tai_responsible  ON tutoria_action_items(responsible_id);

CREATE INDEX idx_tc_ref           ON tutoria_comments(ref_type, ref_id);

-- ─── 10. Verificação final ────────────────────────────────────────────────────
SELECT
    table_name  AS `Tabela`,
    create_time AS `Criada em`
FROM information_schema.tables
WHERE table_schema = 'tradehub'
  AND table_name IN (
      'tutoria_error_categories',
      'tutoria_errors',
      'tutoria_action_plans',
      'tutoria_action_items',
      'tutoria_comments'
  )
ORDER BY table_name;
