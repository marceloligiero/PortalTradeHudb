-- V011: Adicionar department_id às equipas
-- Permite associar cada equipa a um departamento real (tabela departments)

ALTER TABLE teams
  ADD COLUMN department_id INT NULL AFTER product_id,
  ADD CONSTRAINT fk_teams_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
