-- ════════════════════════════════════════════════════════════════════════════
-- deploy/setup-db.sql — Criar base de dados e utilizador MySQL
--
-- Executar uma vez como root:
--   mysql -u root -p < deploy/setup-db.sql
--
-- Substitua 'SENHA_FORTE_AQUI' pela senha real antes de executar.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Base de dados com charset correcto
CREATE DATABASE IF NOT EXISTS tradehub_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Utilizador dedicado (sem acesso root)
--    Substitua 'SENHA_FORTE_AQUI' por uma senha real gerada com:
--    python3 -c "import secrets; print(secrets.token_urlsafe(24))"
CREATE USER IF NOT EXISTS 'tradehub_user'@'localhost'
  IDENTIFIED BY 'SENHA_FORTE_AQUI';

-- 3. Permissões mínimas necessárias
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX,
      DROP, REFERENCES, LOCK TABLES
  ON tradehub_db.*
  TO 'tradehub_user'@'localhost';

FLUSH PRIVILEGES;

-- 4. Verificação
SELECT User, Host FROM mysql.user WHERE User = 'tradehub_user';
SHOW GRANTS FOR 'tradehub_user'@'localhost';
