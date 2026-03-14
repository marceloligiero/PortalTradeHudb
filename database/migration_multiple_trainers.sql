-- Migration: Adicionar suporte para múltiplos formadores por plano de formação
-- Data: 2026-01-29

-- Tabela de associação de formadores a planos (muitos-para-muitos)
CREATE TABLE IF NOT EXISTS training_plan_trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_plan_id INT NOT NULL,
    trainer_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    
    FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_plan_trainer (training_plan_id, trainer_id)
);

-- Migrar dados existentes: inserir o formador atual (trainer_id) como formador principal
INSERT INTO training_plan_trainers (training_plan_id, trainer_id, is_primary, assigned_by)
SELECT id, trainer_id, TRUE, created_by
FROM training_plans
WHERE trainer_id IS NOT NULL
ON DUPLICATE KEY UPDATE is_primary = TRUE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tpt_plan_id ON training_plan_trainers(training_plan_id);
CREATE INDEX IF NOT EXISTS idx_tpt_trainer_id ON training_plan_trainers(trainer_id);
