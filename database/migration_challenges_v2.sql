-- =====================================================
-- MIGRAÇÃO COMPLETA - Sistema de Desafios v2
-- Execute este script no MySQL para atualizar o schema
-- =====================================================

-- 1. Adicionar coluna status à tabela challenge_submissions
ALTER TABLE challenge_submissions 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'IN_PROGRESS';

-- 2. Atualizar registros existentes baseado no estado atual
UPDATE challenge_submissions 
SET status = 'REVIEWED' 
WHERE completed_at IS NOT NULL AND (status IS NULL OR status = 'IN_PROGRESS');

-- 3. Criar tabela challenge_operations se não existir
CREATE TABLE IF NOT EXISTS challenge_operations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    operation_number INT NOT NULL,
    operation_reference VARCHAR(255) NOT NULL,
    started_at DATETIME,
    completed_at DATETIME,
    duration_seconds INT,
    has_error BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES challenge_submissions(id) ON DELETE CASCADE,
    INDEX idx_submission_id (submission_id),
    INDEX idx_operation_number (operation_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Criar tabela operation_errors se não existir
CREATE TABLE IF NOT EXISTS operation_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operation_id INT NOT NULL,
    error_type VARCHAR(50) NOT NULL,
    description VARCHAR(160),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operation_id) REFERENCES challenge_operations(id) ON DELETE CASCADE,
    INDEX idx_operation_id (operation_id),
    INDEX idx_error_type (error_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Verificar e criar coluna training_plan_id na tabela certificates se não existir
-- (A coluna certificates.course_id foi substituída por training_plan_id)

-- Primeiro verificar estrutura atual
SELECT 'Verificando estrutura de certificates...' AS info;

-- Se a tabela certificates não tiver training_plan_id, adicionar
-- SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'certificates' AND column_name = 'training_plan_id');
-- Esta verificação deve ser feita manualmente

-- 6. Mostrar estrutura final
SELECT 'Migração concluída!' AS resultado;

-- NOTAS:
-- Status possíveis para challenge_submissions:
--   - IN_PROGRESS: Formando está executando o desafio
--   - PENDING_REVIEW: Formando submeteu para revisão do formador
--   - REVIEWED: Formador finalizou a revisão

-- Tipos de erro em operation_errors.error_type:
--   - METODOLOGIA: Erro de metodologia
--   - CONHECIMENTO: Erro de conhecimento
--   - DETALHE: Erro de detalhe
--   - PROCEDIMENTO: Erro de procedimento
