-- V013 — Unificação de roles e controlo de acesso por flags
-- Roles unificados: ADMIN, DIRETOR, GERENTE, CHEFE_EQUIPE, FORMADOR, USUARIO
-- Acesso controlado por flags, não pela coluna role
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Adicionar novas colunas de flag
ALTER TABLE users
    ADD COLUMN is_admin         BOOLEAN NOT NULL DEFAULT FALSE AFTER is_referente,
    ADD COLUMN is_diretor       BOOLEAN NOT NULL DEFAULT FALSE AFTER is_admin,
    ADD COLUMN is_gerente       BOOLEAN NOT NULL DEFAULT FALSE AFTER is_diretor,
    ADD COLUMN is_chefe_equipe  BOOLEAN NOT NULL DEFAULT FALSE AFTER is_gerente,
    ADD COLUMN is_formador      BOOLEAN NOT NULL DEFAULT FALSE AFTER is_chefe_equipe;

-- 2. Propagar flags a partir de roles existentes
UPDATE users SET is_admin        = TRUE WHERE role = 'ADMIN';
UPDATE users SET is_gerente      = TRUE WHERE role IN ('MANAGER', 'GESTOR');
UPDATE users SET is_formador     = TRUE WHERE role = 'TRAINER';
UPDATE users SET is_chefe_equipe = TRUE WHERE is_team_lead = TRUE;
UPDATE users SET is_formador     = TRUE WHERE is_trainer   = TRUE AND is_formador = FALSE;

-- 3. Normalizar coluna role para novos valores
UPDATE users SET role = 'FORMADOR'    WHERE role = 'TRAINER';
UPDATE users SET role = 'USUARIO'     WHERE role IN ('TRAINEE', 'STUDENT');
UPDATE users SET role = 'GERENTE'     WHERE role IN ('MANAGER', 'GESTOR');
-- ADMIN permanece ADMIN
-- DIRETOR e CHEFE_EQUIPE são novos — atribuídos manualmente pelo ADMIN via UI

-- 4. Adicionar restrição ao enum de role (comentado para MySQL < 8.0.17)
-- ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN','DIRETOR','GERENTE','CHEFE_EQUIPE','FORMADOR','USUARIO') NOT NULL;

-- 5. Actualizar DW snapshot se existir coluna trainers_count / trainees_count
-- (as views do DW serão actualizadas pelo ETL na próxima execução)
