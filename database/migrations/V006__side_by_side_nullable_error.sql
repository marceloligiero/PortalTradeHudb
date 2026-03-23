-- V006 — Side by Side: error_id opcional em tutoria_action_plans
-- GAP-8: Planos Side by Side não requerem um erro associado.
-- Torna error_id nullable para suportar criação directa sem erro.
ALTER TABLE tutoria_action_plans
  MODIFY COLUMN error_id INT NULL;
