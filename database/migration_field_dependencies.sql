-- ============================================================================
-- Migration: Field Dependencies for Error Registration
-- Dependencies:
--   1. Actividad depends on Banco (Cliente) + Depto
--   2. Tipo Error depends on Actividad  (new table error_types)
--   3. Tipología Error (categories) depends on Origen
-- ============================================================================

-- ── 1. Activities: add bank_id + department_id ──────────────────────────────

ALTER TABLE activities
  ADD COLUMN bank_id INT NULL AFTER description,
  ADD COLUMN department_id INT NULL AFTER bank_id,
  ADD CONSTRAINT fk_activities_bank FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_activities_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Drop the old unique constraint on name (activities can repeat for different bank+depto combos)
ALTER TABLE activities DROP INDEX name;
-- Add composite unique on (name, bank_id, department_id)
ALTER TABLE activities ADD UNIQUE INDEX uq_activity_name_bank_dept (name, bank_id, department_id);

-- ── 2. Error Types: new table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS error_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  activity_id INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_error_types_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
  INDEX idx_error_types_activity (activity_id)
);

-- Add error_type_id to tutoria_errors
ALTER TABLE tutoria_errors
  ADD COLUMN error_type_id INT NULL AFTER activity_id,
  ADD CONSTRAINT fk_errors_error_type FOREIGN KEY (error_type_id) REFERENCES error_types(id) ON DELETE SET NULL;

-- ── 3. Categories (Tipología): add origin_id ────────────────────────────────

ALTER TABLE tutoria_error_categories
  ADD COLUMN origin_id INT NULL AFTER parent_id,
  ADD CONSTRAINT fk_categories_origin FOREIGN KEY (origin_id) REFERENCES error_origins(id) ON DELETE SET NULL;

-- ── 4. Insert Departments ───────────────────────────────────────────────────

INSERT IGNORE INTO departments (name) VALUES
  ('CDE'),
  ('CDI SAN'),
  ('CHEQUES EXTERIORES'),
  ('CONFIRMING'),
  ('CONTROL'),
  ('ESPANA'),
  ('FACTURACION'),
  ('FINANCIACION'),
  ('GARANTIAS'),
  ('GENERAL'),
  ('ONE-UK TRADE'),
  ('OPAGO'),
  ('PAGOS'),
  ('PROYECTOS'),
  ('PRUEBAS'),
  ('REM EXPORTACIONES'),
  ('REM IMPORTACIONES');

-- ── 5. Insert/Update Origins (Origen) ───────────────────────────────────────

INSERT IGNORE INTO error_origins (name) VALUES
  ('Terceros'),
  ('Trade_Tecnología'),
  ('Trade_Procesos');
-- Trade_Personas already exists (id=1)

-- ── 6. Insert Categories (Tipología Error) with origin_id ───────────────────

-- First get origin IDs (we'll use subqueries)
-- Terceros → Proveedores, Oficina/Uni/Middle, Corresponsal
INSERT INTO tutoria_error_categories (name, origin_id) VALUES
  ('Proveedores', (SELECT id FROM error_origins WHERE name = 'Terceros')),
  ('Oficina/Uni/Middle', (SELECT id FROM error_origins WHERE name = 'Terceros')),
  ('Corresponsal', (SELECT id FROM error_origins WHERE name = 'Terceros'));

-- Trade_Tecnología → 3 tipologías
INSERT INTO tutoria_error_categories (name, origin_id) VALUES
  ('Gestión del cambio tecnológico inadecuado', (SELECT id FROM error_origins WHERE name = 'Trade_Tecnología')),
  ('Diseño inadecuado de los sistemas', (SELECT id FROM error_origins WHERE name = 'Trade_Tecnología')),
  ('Funcionamiento inadecuado de un sistema', (SELECT id FROM error_origins WHERE name = 'Trade_Tecnología'));

-- Trade_Procesos → 3 tipologías
INSERT INTO tutoria_error_categories (name, origin_id) VALUES
  ('Diseño ineficaz del proceso', (SELECT id FROM error_origins WHERE name = 'Trade_Procesos')),
  ('Desempeño ineficaz de un proceso', (SELECT id FROM error_origins WHERE name = 'Trade_Procesos')),
  ('Calidad de los datos', (SELECT id FROM error_origins WHERE name = 'Trade_Procesos'));

-- ── 7. Add BANCO SANTANDER bank ────────────────────────────────────────────

INSERT IGNORE INTO banks (code, name, country) VALUES
  ('BSAN', 'BANCO SANTANDER', 'ES');

-- ── 8. Insert Activities for BANCO SANTANDER + CDE ─────────────────────────

INSERT INTO activities (name, bank_id, department_id) VALUES
  ('AGENDA CDE',                   (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('APERTURA',                     (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('CANC. ANTICIPOS',              (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('CONFIRMACION CDE',             (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('CONFIRMACION MODIF. CDE',      (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('CONSULTA CDE',                 (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('CONTROLES CDE',                (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('G/L CDE',                      (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('GESTION SWIFT',                (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('MODIFICACION',                 (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('PDTE RECIBIR CREDITO CDE',     (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('RECONFIRMACION CDE',           (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE')),
  ('REPORTES CDE',                 (SELECT id FROM banks WHERE code = 'BSAN'), (SELECT id FROM departments WHERE name = 'CDE'));

-- ── 9. Insert TipoError entries (depend on activities — using APERTURA CDE as example) ─

-- These SWIFT field codes are typical for CDE (Créditos Documentarios) operations
-- For simplicity, link them to "APERTURA" activity in CDE
SET @apertura_id = (SELECT id FROM activities WHERE name = 'APERTURA' AND department_id = (SELECT id FROM departments WHERE name = 'CDE') AND bank_id = (SELECT id FROM banks WHERE code = 'BSAN') LIMIT 1);

INSERT INTO error_types (name, activity_id) VALUES
  ('2 - Banco A', @apertura_id),
  ('31D - Date/Place', @apertura_id),
  ('32B - Currency/Amount', @apertura_id),
  ('39A - Tolerance', @apertura_id),
  ('40A - Form of Doc. Credit', @apertura_id),
  ('41 - Available With/Payment', @apertura_id),
  ('42P - Drafts Date', @apertura_id),
  ('43P - Partial Shipments / 43T - Transhipments', @apertura_id),
  ('44A - Origen / 44E - Port of Loading / 44F - Port', @apertura_id),
  ('44C - Latest Date of Shipment', @apertura_id),
  ('45A - Description of Goods/Incoterm', @apertura_id),
  ('46A - Documents', @apertura_id),
  ('47A - Additional Conditions', @apertura_id),
  ('48 - Period of Presentation', @apertura_id),
  ('49 - Confirmation Instructions', @apertura_id),
  ('50 - Ordering Customer', @apertura_id);

SELECT 'Migration completed successfully' AS status;
