-- V012: Normalize impact level values to ALTA/BAIXA
-- error_impacts.level: HIGH/ALTO → ALTA, LOW/BAIXO → BAIXA
UPDATE error_impacts SET level = 'ALTA'  WHERE level IN ('HIGH', 'ALTO');
UPDATE error_impacts SET level = 'BAIXA' WHERE level IN ('LOW', 'BAIXO');

-- tutoria_errors.impact_level: normalize legacy values to ALTA/BAIXA
UPDATE tutoria_errors SET impact_level = 'ALTA'  WHERE impact_level IN ('ALTO', 'CRITICO', 'HIGH');
UPDATE tutoria_errors SET impact_level = 'BAIXA' WHERE impact_level IN ('BAIXO', 'MEDIO', 'LOW');

-- Backfill impact_level from impact_id join for records with NULL impact_level
UPDATE tutoria_errors te
  JOIN error_impacts ei ON te.impact_id = ei.id
SET te.impact_level = ei.level
WHERE te.impact_level IS NULL AND ei.level IS NOT NULL;
