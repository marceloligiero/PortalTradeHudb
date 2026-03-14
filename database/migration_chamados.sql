-- ============================================================
-- Migration: Portal de Chamados (Support Tickets / Kanban)
-- ============================================================

CREATE TABLE IF NOT EXISTS chamados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,

    -- Tipo: BUG ou MELHORIA
    type VARCHAR(20) NOT NULL DEFAULT 'BUG',

    -- Prioridade: BAIXA, MEDIA, ALTA, CRITICA
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIA',

    -- Status Kanban: ABERTO, EM_ANDAMENTO, EM_REVISAO, CONCLUIDO
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTO',

    -- Portal onde se aplica (FORMACOES, TUTORIA, RELATORIOS, DADOS_MESTRES, GERAL)
    portal VARCHAR(30) NOT NULL DEFAULT 'GERAL',

    -- Quem criou (todos os users podem criar)
    created_by_id INT NOT NULL,

    -- Quem foi atribuído (preenchido pelo ADMIN)
    assigned_to_id INT NULL,

    -- Notas do admin sobre o andamento
    admin_notes TEXT NULL,

    -- Data de conclusão
    completed_at DATETIME(6) NULL,

    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),

    FOREIGN KEY (created_by_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_chamados_status (status),
    INDEX idx_chamados_type (type),
    INDEX idx_chamados_created_by (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS chamado_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chamado_id INT NOT NULL,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),

    FOREIGN KEY (chamado_id) REFERENCES chamados(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_chamado_comments_chamado (chamado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
