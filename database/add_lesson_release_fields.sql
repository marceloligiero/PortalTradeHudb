-- Adicionar campos de liberação de aula pelo formador
-- is_released: indica se o formador liberou a aula para o formando assistir
-- released_by: ID do formador que liberou
-- released_at: momento da liberação

-- Adicionar coluna is_released
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS is_released BOOLEAN DEFAULT FALSE;

-- Adicionar coluna released_by (FK para users)
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS released_by INT NULL;

-- Adicionar coluna released_at
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS released_at DATETIME NULL;

-- Adicionar foreign key para released_by
ALTER TABLE lesson_progress
ADD CONSTRAINT fk_lesson_progress_released_by 
FOREIGN KEY (released_by) REFERENCES users(id) ON DELETE SET NULL;

-- Atualizar status para incluir RELEASED
-- Status possíveis: NOT_STARTED, RELEASED, IN_PROGRESS, PAUSED, COMPLETED

-- Remover server_default de started_at (agora só é preenchido quando formando inicia)
-- MySQL não permite remover default facilmente, mas podemos garantir que NULL é permitido
ALTER TABLE lesson_progress 
MODIFY COLUMN started_at DATETIME NULL;

-- Criar índice para melhorar performance de queries por status
CREATE INDEX IF NOT EXISTS idx_lesson_progress_status ON lesson_progress(status);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_is_released ON lesson_progress(is_released);
