-- V007 — Reset hierarquia organizacional
-- Remove nós inválidos (nomes de pessoas adicionados por engano como nós)
-- e garante que a estrutura correcta do Santander Trade Finance está presente.
-- É seguro re-executar: usa IF NOT EXISTS / INSERT ... ON DUPLICATE KEY.

-- 1. Limpar tudo e recomeçar de raiz
DELETE FROM org_node_members;
DELETE FROM org_node_audit;
DELETE FROM org_nodes;

-- 2. Raiz
INSERT INTO org_nodes (name, description, parent_id, position, is_active)
VALUES ('SANTANDER TRADE FINANCE', 'Operações Internacionais de Trade Finance', NULL, 0, 1);

-- 3. Nível 2
INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'GESTÃO & SUPORTE', 'Equipas de suporte, metodologia e clientes',
       id, 0, 1 FROM org_nodes WHERE parent_id IS NULL LIMIT 1;

INSERT INTO org_nodes (name, description, parent_id, position, is_active)
SELECT 'OPERAÇÕES', 'Equipas operacionais por produto financeiro',
       id, 1, 1 FROM org_nodes WHERE parent_id IS NULL LIMIT 1;

-- 4. Filhos de GESTÃO & SUPORTE
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
SELECT 'SOURCING', 'Aprovisionamento e sourcing',
       id, 5, 1 FROM org_nodes WHERE name = 'GESTÃO & SUPORTE' LIMIT 1;

-- 5. Filhos de OPERAÇÕES
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

-- 6. Re-ligar equipas ao nó correspondente
UPDATE teams t
JOIN org_nodes n ON n.name = t.name
SET t.node_id = n.id
WHERE n.parent_id IS NOT NULL;
