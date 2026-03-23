-- V010: Corrigir dados de bancos — garante os 4 bancos Santander correctos
--
-- Problema: HP tinha bancos errados (PT/ES/UN/BSAN) nos IDs 1-4 criados por
-- versoes anteriores do V001 sem IDs explicitos. INSERT IGNORE nao corrige
-- linhas com PK duplicada mas valores errados.
--
-- Fix: DELETE dos bancos incorrectos + UPSERT com IDs e codigos correctos.

SET FOREIGN_KEY_CHECKS = 0;

-- Remover quaisquer bancos com codigos incorrectos
DELETE FROM banks WHERE code NOT IN ('BSA', 'BST', 'SUK', 'SCB');

-- Inserir ou actualizar os 4 bancos Santander correctos
INSERT INTO banks (id, code, name, country, is_active) VALUES
    (1, 'BSA', 'BANCO SANTANDER, S.A.',      'ES', 1),
    (2, 'BST', 'BANCO SANTANDER TOTTA',       'PT', 1),
    (3, 'SUK', 'SANTANDER UK',                'UK', 1),
    (4, 'SCB', 'SANTANDER CONSUMER BANK AG',  'DE', 1)
ON DUPLICATE KEY UPDATE
    code       = VALUES(code),
    name       = VALUES(name),
    country    = VALUES(country),
    is_active  = 1;

-- Garantir que o AUTO_INCREMENT nao colide com os IDs fixos
ALTER TABLE banks AUTO_INCREMENT = 5;

SET FOREIGN_KEY_CHECKS = 1;
