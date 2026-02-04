-- Migration: Adicionar campo difficulty aos desafios
-- Data: 2026-02-04

-- Adicionar coluna difficulty à tabela challenges
ALTER TABLE challenges 
ADD COLUMN difficulty VARCHAR(20) DEFAULT 'medium' AFTER description;

-- Mensagem de conclusão
SELECT 'Campo difficulty adicionado à tabela challenges com sucesso!' AS status;
