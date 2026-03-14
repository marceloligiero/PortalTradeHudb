-- ===========================================
-- MIGRAÇÃO v2 - Sistema Completo de Formação
-- ===========================================

-- 1. Adicionar campos KPI e liberação nos desafios
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS use_volume_kpi BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS use_mpu_kpi BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS use_errors_kpi BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_released BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS released_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS released_by INT NULL;

-- Adicionar FK para released_by
-- ALTER TABLE challenges ADD CONSTRAINT fk_challenges_released_by FOREIGN KEY (released_by) REFERENCES users(id);

-- 2. Adicionar campos de confirmação do formando no progresso de aulas
ALTER TABLE lesson_progress
ADD COLUMN IF NOT EXISTS student_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS student_confirmed_at DATETIME NULL;

-- 3. Criar tabela de operações individuais para desafios COMPLETE
CREATE TABLE IF NOT EXISTS challenge_operations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    operation_number INT NOT NULL,
    operation_reference VARCHAR(255) NOT NULL,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    duration_seconds INT NULL,
    has_error BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES challenge_submissions(id) ON DELETE CASCADE,
    INDEX idx_submission (submission_id),
    INDEX idx_reference (operation_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Criar tabela de erros por operação
CREATE TABLE IF NOT EXISTS operation_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operation_id INT NOT NULL,
    error_type VARCHAR(50) NOT NULL COMMENT 'METHODOLOGY, KNOWLEDGE, DETAIL, PROCEDURE',
    description VARCHAR(160) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operation_id) REFERENCES challenge_operations(id) ON DELETE CASCADE,
    INDEX idx_operation (operation_id),
    INDEX idx_error_type (error_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Atualizar comentário do campo max_errors para clarificar
-- ALTER TABLE challenges MODIFY COLUMN max_errors INT DEFAULT 0 COMMENT 'Máximo de OPERAÇÕES com erro (não erros totais)';

-- 6. Atualizar desafios existentes para terem valores padrão nos novos campos
UPDATE challenges SET 
    use_volume_kpi = TRUE,
    use_mpu_kpi = TRUE,
    use_errors_kpi = TRUE,
    is_released = FALSE
WHERE use_volume_kpi IS NULL;

-- 7. Atualizar progresso de aulas existentes
UPDATE lesson_progress SET 
    student_confirmed = FALSE
WHERE student_confirmed IS NULL;

-- Verificação
SELECT 'Migração v2 completada com sucesso!' as status;
