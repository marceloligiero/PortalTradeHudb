-- =============================================================================
-- Migração: tutoria_error_motivos
-- Permite múltiplos motivos (tipologia + descrição) por erro de tutoria
-- Executar em: MySQL 8.x
-- Instrução: mysql -u root tradehub < migration_error_motivos.sql
-- =============================================================================

USE tradehub;

CREATE TABLE IF NOT EXISTS tutoria_error_motivos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    error_id    INT             NOT NULL,
    typology    VARCHAR(50)     NOT NULL,          -- METHODOLOGY | KNOWLEDGE | DETAIL | PROCEDURE
    description VARCHAR(500)    NULL,              -- Descrição do motivo (max 500 chars)
    created_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_tem_error
        FOREIGN KEY (error_id) REFERENCES tutoria_errors(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tem_error ON tutoria_error_motivos(error_id);
CREATE INDEX idx_tem_typology ON tutoria_error_motivos(typology);

-- Verificação
SELECT table_name AS `Tabela`, create_time AS `Criada em`
FROM information_schema.tables
WHERE table_schema = 'tradehub' AND table_name = 'tutoria_error_motivos';
