-- =====================================================================
-- SCRIPT DE MIGRAÇÃO — NOVOS MÓDULOS (pós migration_production_unified)
-- Base de dados: tradehub (MySQL 8.x)
-- Módulos: Teams · Portal Tutoria · Chatbot · Motivos de Erro
-- Seguro para executar múltiplas vezes (idempotente)
-- Gerado em: 2026-03-02
--
-- Pré-requisito: migration_production_unified.sql já aplicado.
-- Instrução   : mysql -u root tradehub < migration_new_modules.sql
-- =====================================================================

USE tradehub;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- HELPERS idempotentes (dropped no final)
-- =====================================================================

DROP PROCEDURE IF EXISTS _add_col;
DELIMITER //
CREATE PROCEDURE _add_col(
    IN p_tbl  VARCHAR(64),
    IN p_col  VARCHAR(64),
    IN p_def  VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name   = p_tbl
          AND column_name  = p_col
    ) THEN
        SET @_sql = CONCAT('ALTER TABLE `', p_tbl, '` ADD COLUMN `', p_col, '` ', p_def);
        PREPARE _s FROM @_sql; EXECUTE _s; DEALLOCATE PREPARE _s;
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS _add_fk;
DELIMITER //
CREATE PROCEDURE _add_fk(
    IN p_name    VARCHAR(64),
    IN p_tbl     VARCHAR(64),
    IN p_col     VARCHAR(64),
    IN p_ref_tbl VARCHAR(64),
    IN p_ref_col VARCHAR(64),
    IN p_on_del  VARCHAR(50)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema    = DATABASE()
          AND table_name      = p_tbl
          AND constraint_name = p_name
          AND constraint_type = 'FOREIGN KEY'
    ) THEN
        SET @_sql = CONCAT(
            'ALTER TABLE `', p_tbl, '` ADD CONSTRAINT `', p_name,
            '` FOREIGN KEY (`', p_col, '`) REFERENCES `', p_ref_tbl,
            '`(`', p_ref_col, '`) ON DELETE ', p_on_del
        );
        PREPARE _s FROM @_sql; EXECUTE _s; DEALLOCATE PREPARE _s;
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS _add_idx;
DELIMITER //
CREATE PROCEDURE _add_idx(
    IN p_name VARCHAR(64),
    IN p_tbl  VARCHAR(64),
    IN p_cols VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name   = p_tbl
          AND index_name   = p_name
    ) THEN
        SET @_sql = CONCAT('CREATE INDEX `', p_name, '` ON `', p_tbl, '`(', p_cols, ')');
        PREPARE _s FROM @_sql; EXECUTE _s; DEALLOCATE PREPARE _s;
    END IF;
END //
DELIMITER ;


-- =====================================================================
-- MÓDULO 1: TEAMS
-- =====================================================================

SELECT '=== MÓDULO 1: Teams ===' AS progress;

-- 1.1 Tabela teams
CREATE TABLE IF NOT EXISTS teams (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200)  NOT NULL,
    description TEXT          NULL,
    product_id  INT           NULL,
    manager_id  INT           NULL,
    is_active   TINYINT(1)    NOT NULL DEFAULT 1,
    created_at  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)   NULL ON UPDATE CURRENT_TIMESTAMP(6),

    INDEX idx_teams_product (product_id),
    INDEX idx_teams_manager (manager_id),
    INDEX idx_teams_active  (is_active),

    CONSTRAINT fk_team_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    CONSTRAINT fk_team_manager FOREIGN KEY (manager_id) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Coluna team_id em users
CALL _add_col('users', 'team_id', 'INT NULL');
CALL _add_fk('fk_user_team', 'users', 'team_id', 'teams', 'id', 'SET NULL');

SELECT 'Módulo Teams OK.' AS resultado;


-- =====================================================================
-- MÓDULO 2: PORTAL TUTORIA
-- =====================================================================

SELECT '=== MÓDULO 2: Portal Tutoria ===' AS progress;

-- 2.1 Coluna tutor_id em users
CALL _add_col('users', 'tutor_id', 'INT NULL');
CALL _add_fk('fk_user_tutor', 'users', 'tutor_id', 'users', 'id', 'SET NULL');

-- 2.2 Categorias de Erro
CREATE TABLE IF NOT EXISTS tutoria_error_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT         NULL,
    parent_id   INT          NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX idx_tec_parent (parent_id),
    CONSTRAINT fk_tec_parent
        FOREIGN KEY (parent_id) REFERENCES tutoria_error_categories(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed de categorias (só insere se a tabela estiver vazia)
INSERT INTO tutoria_error_categories (name, description)
SELECT src.name, src.description FROM (
    SELECT 'Processo'      AS name, 'Erros relacionados com processos e fluxos de trabalho' AS description UNION ALL
    SELECT 'Comunicação',           'Erros de comunicação interna ou com clientes'           UNION ALL
    SELECT 'Técnico',               'Erros técnicos ou de conhecimento especializado'        UNION ALL
    SELECT 'Documentação',          'Erros em preenchimento ou arquivo de documentos'        UNION ALL
    SELECT 'Atendimento',           'Erros no atendimento ao cliente ou parceiro'            UNION ALL
    SELECT 'Compliance',            'Erros de conformidade regulatória ou interna'           UNION ALL
    SELECT 'Qualidade',             'Erros de controlo de qualidade ou verificação'
) AS src
WHERE NOT EXISTS (SELECT 1 FROM tutoria_error_categories LIMIT 1);

-- 2.3 Erros
CREATE TABLE IF NOT EXISTS tutoria_errors (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    date_occurrence     DATE        NOT NULL,
    description         TEXT        NOT NULL,
    tutorado_id         INT         NOT NULL,
    created_by_id       INT         NOT NULL,
    category_id         INT         NULL,
    product_id          INT         NULL,           -- serviço/produto associado
    severity            VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    status              VARCHAR(30) NOT NULL DEFAULT 'ABERTO',
    tags                JSON        NULL,
    analysis_5_why      TEXT        NULL,
    is_recurrent        TINYINT(1)  NOT NULL DEFAULT 0,
    recurrence_count    INT         NOT NULL DEFAULT 0,
    is_active           TINYINT(1)  NOT NULL DEFAULT 1,
    inactivation_reason TEXT        NULL,
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),

    INDEX idx_te_tutorado  (tutorado_id),
    INDEX idx_te_category  (category_id),
    INDEX idx_te_product   (product_id),
    INDEX idx_te_status    (status),
    INDEX idx_te_severity  (severity),
    INDEX idx_te_recurrent (is_recurrent),

    CONSTRAINT fk_te_tutorado  FOREIGN KEY (tutorado_id)  REFERENCES users(id)                     ON DELETE RESTRICT,
    CONSTRAINT fk_te_creator   FOREIGN KEY (created_by_id) REFERENCES users(id)                    ON DELETE RESTRICT,
    CONSTRAINT fk_te_category  FOREIGN KEY (category_id)  REFERENCES tutoria_error_categories(id)  ON DELETE SET NULL,
    CONSTRAINT fk_te_product   FOREIGN KEY (product_id)   REFERENCES products(id)                  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3a Garante coluna product_id se a tabela já existia sem ela
CALL _add_col('tutoria_errors', 'product_id', 'INT NULL AFTER category_id');
CALL _add_idx('idx_te_product',  'tutoria_errors', '`product_id`');
CALL _add_fk('fk_te_product', 'tutoria_errors', 'product_id', 'products', 'id', 'SET NULL');

-- 2.4 Motivos de Erro (tipologia múltipla por erro)
CREATE TABLE IF NOT EXISTS tutoria_error_motivos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    error_id    INT             NOT NULL,
    typology    VARCHAR(50)     NOT NULL,   -- METHODOLOGY | KNOWLEDGE | DETAIL | PROCEDURE
    description VARCHAR(500)    NULL,
    created_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX idx_tem_error    (error_id),
    INDEX idx_tem_typology (typology),

    CONSTRAINT fk_tem_error
        FOREIGN KEY (error_id) REFERENCES tutoria_errors(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.5 Planos de Ação
CREATE TABLE IF NOT EXISTS tutoria_action_plans (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    error_id             INT         NOT NULL,
    created_by_id        INT         NOT NULL,
    tutorado_id          INT         NOT NULL,

    analysis_5_why       TEXT        NULL,
    immediate_correction TEXT        NULL,
    corrective_action    TEXT        NULL,
    preventive_action    TEXT        NULL,

    what                 TEXT        NULL,
    why                  TEXT        NULL,
    where_field          TEXT        NULL,
    when_deadline        DATE        NULL,
    who                  TEXT        NULL,
    how                  TEXT        NULL,
    how_much             TEXT        NULL,

    status               VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO',
    approved_by_id       INT         NULL,
    approved_at          DATETIME(6) NULL,
    validated_by_id      INT         NULL,
    validated_at         DATETIME(6) NULL,

    created_at           DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at           DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),

    INDEX idx_tap_error    (error_id),
    INDEX idx_tap_tutorado (tutorado_id),
    INDEX idx_tap_status   (status),

    CONSTRAINT fk_tap_error     FOREIGN KEY (error_id)        REFERENCES tutoria_errors(id)  ON DELETE CASCADE,
    CONSTRAINT fk_tap_creator   FOREIGN KEY (created_by_id)   REFERENCES users(id)           ON DELETE RESTRICT,
    CONSTRAINT fk_tap_tutorado  FOREIGN KEY (tutorado_id)     REFERENCES users(id)           ON DELETE RESTRICT,
    CONSTRAINT fk_tap_approver  FOREIGN KEY (approved_by_id)  REFERENCES users(id)           ON DELETE SET NULL,
    CONSTRAINT fk_tap_validator FOREIGN KEY (validated_by_id) REFERENCES users(id)           ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.6 Ações Individuais do Plano
CREATE TABLE IF NOT EXISTS tutoria_action_items (
    id               INT         AUTO_INCREMENT PRIMARY KEY,
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

-- 2.7 Comentários (erros e planos)
CREATE TABLE IF NOT EXISTS tutoria_comments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    ref_type   VARCHAR(20) NOT NULL,   -- 'error' | 'plan'
    ref_id     INT         NOT NULL,
    author_id  INT         NOT NULL,
    content    TEXT        NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX idx_tc_ref (ref_type, ref_id),

    CONSTRAINT fk_tc_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Módulo Portal Tutoria OK.' AS resultado;


-- =====================================================================
-- MÓDULO 3: CHATBOT — FAQ PERSONALIZADO
-- =====================================================================

SELECT '=== MÓDULO 3: Chat FAQs ===' AS progress;

CREATE TABLE IF NOT EXISTS chat_faqs (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    keywords_pt   TEXT         NOT NULL,
    keywords_es   TEXT         NULL,
    keywords_en   TEXT         NULL,
    answer_pt     TEXT         NOT NULL,
    answer_es     TEXT         NULL,
    answer_en     TEXT         NULL,
    support_url   VARCHAR(500) NULL,
    support_label VARCHAR(200) NULL,
    role_filter   VARCHAR(100) NULL,   -- NULL = todos os roles
    priority      INT          NOT NULL DEFAULT 0,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_by_id INT          NULL,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)  NULL ON UPDATE CURRENT_TIMESTAMP(6),

    INDEX idx_cf_active   (is_active),
    INDEX idx_cf_priority (priority),

    CONSTRAINT fk_cf_creator FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Módulo Chat FAQs OK.' AS resultado;


-- =====================================================================
-- LIMPEZA
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 1;

DROP PROCEDURE IF EXISTS _add_col;
DROP PROCEDURE IF EXISTS _add_fk;
DROP PROCEDURE IF EXISTS _add_idx;


-- =====================================================================
-- VERIFICAÇÃO FINAL
-- =====================================================================

SELECT '=== VERIFICAÇÃO FINAL ===' AS progress;

SELECT table_name AS `Tabela`, table_rows AS `Linhas (aprox.)`, create_time AS `Criada em`
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
      'teams',
      'tutoria_error_categories',
      'tutoria_errors',
      'tutoria_error_motivos',
      'tutoria_action_plans',
      'tutoria_action_items',
      'tutoria_comments',
      'chat_faqs'
  )
ORDER BY table_name;

SELECT column_name AS `Coluna`, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name   = 'users'
  AND column_name  IN ('tutor_id', 'team_id')
ORDER BY column_name;

SELECT '✅ Migração de novos módulos concluída com sucesso!' AS resultado;
SELECT CONCAT('Base de dados : ', DATABASE()) AS info;
SELECT CONCAT('Data execução : ', NOW())      AS info;
