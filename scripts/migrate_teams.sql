-- =============================================================================
-- Migração: Tabela teams + team_id em users + role MANAGER
-- Base de dados: tradehub (MySQL 8.x)
-- Instrução: mysql -u root tradehub < migrate_teams.sql
-- =============================================================================

USE tradehub;

-- ── 1. Criar tabela teams ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200)  NOT NULL,
    description TEXT          NULL,
    product_id  INT           NULL,
    manager_id  INT           NULL,
    is_active   TINYINT(1)    NOT NULL DEFAULT 1,
    created_at  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)   NULL ON UPDATE CURRENT_TIMESTAMP(6),

    INDEX idx_teams_product  (product_id),
    INDEX idx_teams_manager  (manager_id),
    INDEX idx_teams_active   (is_active),

    CONSTRAINT fk_team_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE SET NULL,
    CONSTRAINT fk_team_manager FOREIGN KEY (manager_id)
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Tabela teams criada.' AS resultado;

-- ── 2. Adicionar team_id a users (MySQL 8.4 safe) ────────────────────────────
SET @col_team = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'team_id');
SET @sql_team = IF(@col_team = 0,
    'ALTER TABLE users ADD COLUMN team_id INT NULL',
    'SELECT 1 AS noop');
PREPARE s FROM @sql_team; EXECUTE s; DEALLOCATE PREPARE s;

-- FK separada (só adicionar se coluna acabou de ser criada e FK não existe)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    AND CONSTRAINT_NAME = 'fk_user_team' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sql_fk = IF(@fk_exists = 0 AND @col_team = 0,
    'ALTER TABLE users ADD CONSTRAINT fk_user_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL',
    'SELECT 1 AS noop');
PREPARE s2 FROM @sql_fk; EXECUTE s2; DEALLOCATE PREPARE s2;

SELECT IF(@col_team = 0, 'Coluna team_id adicionada a users.', 'Coluna team_id já existe.') AS resultado;

-- ── 3. Nota: role MANAGER — a coluna role é VARCHAR(50) sem enum,
--      basta usar 'MANAGER' como valor. Não é necessária migração adicional.
SELECT 'Role MANAGER disponível (VARCHAR sem restrições enum).' AS resultado;
