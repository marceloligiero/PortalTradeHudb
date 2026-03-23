-- V004: Hierarquia Organizacional
-- Estrutura dinâmica e ilimitada em níveis com auditoria completa

-- Tabela principal: nós da hierarquia (árvore adjacência)
CREATE TABLE IF NOT EXISTS org_nodes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT         NULL,
    parent_id   INT          NULL,
    position    INT          NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by  INT          NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_org_nodes_parent
        FOREIGN KEY (parent_id) REFERENCES org_nodes(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_org_nodes_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_org_nodes_parent  (parent_id),
    INDEX idx_org_nodes_position(parent_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Membros de cada nó (M2M user ↔ org_node)
CREATE TABLE IF NOT EXISTS org_node_members (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    node_id     INT  NOT NULL,
    user_id     INT  NOT NULL,
    assigned_by INT  NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_onm_node
        FOREIGN KEY (node_id) REFERENCES org_nodes(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_onm_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_onm_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    UNIQUE KEY uq_org_node_member (node_id, user_id),
    INDEX idx_onm_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auditoria de alterações na hierarquia
CREATE TABLE IF NOT EXISTS org_node_audit (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    node_id      INT          NULL,
    node_name    VARCHAR(200) NULL,
    action       VARCHAR(50)  NOT NULL,   -- CREATE, UPDATE, DELETE, MOVE, ADD_MEMBER, REMOVE_MEMBER
    old_value    JSON         NULL,
    new_value    JSON         NULL,
    performed_by INT          NULL,
    performed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ona_performed_by
        FOREIGN KEY (performed_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_ona_node_id     (node_id),
    INDEX idx_ona_performed_at(performed_at),
    INDEX idx_ona_performed_by(performed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
