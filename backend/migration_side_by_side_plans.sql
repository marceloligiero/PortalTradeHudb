-- Migration: Allow side-by-side plans without an associated error
-- GAP 8: Seguimento Side by Side no Portal de Tutoria
-- Date: 2026-03-20

-- Make error_id nullable in tutoria_action_plans to support Side by Side plans
-- that are not linked to a specific tutoria error.
ALTER TABLE tutoria_action_plans
  MODIFY COLUMN error_id INT NULL;
