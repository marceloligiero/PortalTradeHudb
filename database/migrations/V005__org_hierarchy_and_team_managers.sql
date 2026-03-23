-- ══════════════════════════════════════════════════════════════════════════════
-- V005 — Hierarquia Organizacional Santander Trade Finance
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Limpar dados de teste anteriores (mantém estrutura de tabelas)
DELETE FROM org_node_members;
DELETE FROM org_node_audit;
DELETE FROM org_nodes;

-- 2. Coluna node_id em teams (liga equipa ao nó da hierarquia)
ALTER TABLE teams ADD COLUMN node_id INT NULL;
ALTER TABLE teams ADD CONSTRAINT fk_teams_node
    FOREIGN KEY (node_id) REFERENCES org_nodes(id) ON DELETE SET NULL;

-- 3. Nó raiz
INSERT INTO org_nodes (name, description, parent_id, position, is_active)
VALUES ('SANTANDER TRADE FINANCE', 'Operações Internacionais de Trade Finance', NULL, 0, 1);

-- 4. Grupos de 2º nível
INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'GESTÃO & SUPORTE', 'Equipas de suporte, metodologia e clientes',
       id, 0, 1 FROM org_nodes WHERE parent_id IS NULL LIMIT 1;

INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'OPERAÇÕES', 'Equipas operacionais por produto financeiro',
       id, 1, 1 FROM org_nodes WHERE parent_id IS NULL LIMIT 1;

-- 5. Equipas de Gestão & Suporte (3º nível)
INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'CLIENT MANAGER', 'Gestão de clientes e interface comercial',
       id, 0, 1 FROM org_nodes WHERE name = 'GESTÃO & SUPORTE' LIMIT 1;

INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'RESPONSABLE', 'Responsável operacional e supervisão',
       id, 1, 1 FROM org_nodes WHERE name = 'GESTÃO & SUPORTE' LIMIT 1;

INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'DATA', 'Análise de dados e reporting',
       id, 2, 1 FROM org_nodes WHERE name = 'GESTÃO & SUPORTE' LIMIT 1;

INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'METODOLOGIA Y SOPORTE', 'Qualidade, formação e suporte operacional',
       id, 3, 1 FROM org_nodes WHERE name = 'GESTÃO & SUPORTE' LIMIT 1;

INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'PROYECTOS', 'Implementação e gestão de projectos',
       id, 4, 1 FROM org_nodes WHERE name = 'GESTÃO & SUPORTE' LIMIT 1;

INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'Sourcing', 'Aprovisionamento e sourcing',
       id, 5, 1 FROM org_nodes WHERE name = 'GESTÃO & SUPORTE' LIMIT 1;

-- 6. Equipas de Operações (3º nível)
INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'REMESAS', 'Remesas de Importação e Exportação',
       id, 0, 1 FROM org_nodes WHERE name = 'OPERAÇÕES' LIMIT 1;

INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'CREDITOS DOCUMENTARIOS', 'Créditos Documentários de Importação',
       id, 1, 1 FROM org_nodes WHERE name = 'OPERAÇÕES' LIMIT 1;

INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'GARANTIAS', 'Garantias Emitidas e Recebidas',
       id, 2, 1 FROM org_nodes WHERE name = 'OPERAÇÕES' LIMIT 1;

INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'PAGOS FINANCIADOS', 'Ordens de Pagamento Financiadas e Eurocobros',
       id, 3, 1 FROM org_nodes WHERE name = 'OPERAÇÕES' LIMIT 1;

-- 7. Ligar tabela teams aos org_nodes correspondentes
UPDATE teams t
JOIN org_nodes n ON n.name = t.name
SET t.node_id = n.id
WHERE n.parent_id IS NOT NULL;
