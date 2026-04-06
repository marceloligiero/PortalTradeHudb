-- V015 — Correcção de flags de acesso baseadas na coluna role
-- Problema: V013 corria o UPDATE quando a tabela users estava vazia
-- (o utilizador admin é criado DEPOIS das migrations no seed).
-- Esta migration garante que as flags estão correctas para todos os utilizadores existentes.
-- Idempotente: pode correr múltiplas vezes sem efeitos secundários.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE users SET is_admin        = TRUE WHERE role = 'ADMIN'        AND is_admin        = FALSE;
UPDATE users SET is_diretor      = TRUE WHERE role = 'DIRETOR'      AND is_diretor      = FALSE;
UPDATE users SET is_gerente      = TRUE WHERE role = 'GERENTE'      AND is_gerente      = FALSE;
UPDATE users SET is_chefe_equipe = TRUE WHERE role = 'CHEFE_EQUIPE' AND is_chefe_equipe = FALSE;
UPDATE users SET is_formador     = TRUE WHERE role = 'FORMADOR'     AND is_formador     = FALSE;
