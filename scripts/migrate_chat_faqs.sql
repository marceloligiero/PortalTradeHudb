-- =============================================================================
-- Migração: Tabela chat_faqs para o chatbot local
-- Base de dados: tradehub (MySQL 8.x)
-- Instrução: mysql -u root tradehub < migrate_chat_faqs.sql
-- =============================================================================

USE tradehub;

CREATE TABLE IF NOT EXISTS chat_faqs (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    keywords_pt   TEXT        NOT NULL,
    keywords_es   TEXT        NULL,
    keywords_en   TEXT        NULL,
    answer_pt     TEXT        NOT NULL,
    answer_es     TEXT        NULL,
    answer_en     TEXT        NULL,
    support_url   VARCHAR(500) NULL,
    support_label VARCHAR(200) NULL,
    role_filter   VARCHAR(100) NULL,
    priority      INT         NOT NULL DEFAULT 0,
    is_active     TINYINT(1)  NOT NULL DEFAULT 1,
    created_by_id INT         NULL,
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),

    INDEX idx_cf_active   (is_active),
    INDEX idx_cf_priority (priority),

    CONSTRAINT fk_cf_creator FOREIGN KEY (created_by_id)
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Tabela chat_faqs criada.' AS resultado;
