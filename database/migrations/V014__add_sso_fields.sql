-- V014 — Adicionar campos SSO (Microsoft Entra ID) à tabela users
-- e tornar hashed_password opcional (utilizadores SSO não têm password local).
--
-- SAFE: nunca apaga dados. Wrapped em BEGIN/COMMIT.

BEGIN;

ALTER TABLE users
  MODIFY COLUMN hashed_password VARCHAR(255) NULL,
  ADD COLUMN sso_provider VARCHAR(50)  NULL AFTER hashed_password,
  ADD COLUMN sso_id       VARCHAR(255) NULL AFTER sso_provider;

CREATE INDEX idx_users_sso ON users (sso_provider, sso_id);

COMMIT;
