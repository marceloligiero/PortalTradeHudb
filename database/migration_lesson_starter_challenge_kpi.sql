-- Migration: Adicionar campo started_by nas aulas e kpi_mode nos desafios
-- Date: 2026-01-16

-- 1. Adicionar campo started_by na tabela lessons
-- Define quem pode iniciar a aula: TRAINER ou TRAINEE
ALTER TABLE lessons ADD COLUMN started_by VARCHAR(50) DEFAULT 'TRAINER';

-- 2. Adicionar campo kpi_mode na tabela challenges
-- Define o modo de avaliação: AUTO (automático por KPI) ou MANUAL (formador decide)
ALTER TABLE challenges ADD COLUMN kpi_mode VARCHAR(20) DEFAULT 'AUTO';

-- 3. Adicionar campo allow_retry na tabela challenges
-- Permite que o formador habilite nova tentativa se reprovado
ALTER TABLE challenges ADD COLUMN allow_retry BOOLEAN DEFAULT FALSE;

-- 4. Adicionar campo retry_count na tabela challenge_submissions
-- Conta quantas tentativas o formando já fez
ALTER TABLE challenge_submissions ADD COLUMN retry_count INT DEFAULT 0;

-- 5. Adicionar campo is_retry_allowed na tabela challenge_submissions
-- Indica se o formador habilitou nova tentativa após reprovação
ALTER TABLE challenge_submissions ADD COLUMN is_retry_allowed BOOLEAN DEFAULT FALSE;

-- 6. Adicionar campo trainer_notes na tabela challenge_submissions
-- Notas do formador sobre a decisão (especialmente para KPI manual)
ALTER TABLE challenge_submissions ADD COLUMN trainer_notes TEXT;

-- Atualizar registros existentes
UPDATE lessons SET started_by = 'TRAINER' WHERE started_by IS NULL;
UPDATE challenges SET kpi_mode = 'AUTO' WHERE kpi_mode IS NULL;
UPDATE challenges SET allow_retry = FALSE WHERE allow_retry IS NULL;
