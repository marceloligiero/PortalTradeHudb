-- Adicionar campo status à tabela challenge_submissions
-- Status: IN_PROGRESS, PENDING_REVIEW, REVIEWED

ALTER TABLE challenge_submissions 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'IN_PROGRESS';

-- Atualizar registros existentes:
-- - Se completed_at IS NOT NULL -> REVIEWED
-- - Senão -> IN_PROGRESS
UPDATE challenge_submissions 
SET status = 'REVIEWED' 
WHERE completed_at IS NOT NULL AND (status IS NULL OR status = 'IN_PROGRESS');
