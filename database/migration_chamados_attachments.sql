-- Migration: Add attachments column to chamados table
-- Run this if the chamados table already exists (created before this column was added).

ALTER TABLE chamados
    ADD COLUMN IF NOT EXISTS attachments JSON NULL
    COMMENT 'Base64-encoded screenshots attached to the ticket';
