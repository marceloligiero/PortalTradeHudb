-- V008: adiciona member_role a org_node_members
-- Permite marcar quem é DIRECTOR e MANAGER no nó raiz da hierarquia.
-- Apenas o admin pode atribuir estes papéis via /api/org/staff.

ALTER TABLE org_node_members
  ADD COLUMN member_role VARCHAR(50) NULL DEFAULT NULL
  COMMENT 'DIRECTOR ou MANAGER no no raiz';
