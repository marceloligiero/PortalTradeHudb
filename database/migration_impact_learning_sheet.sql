-- Migration: Add impact level/image to error_impacts + create learning sheets table
-- Run on existing databases to add the new columns and table.

-- 1. Add level and image_url to error_impacts
ALTER TABLE error_impacts
    ADD COLUMN IF NOT EXISTS level VARCHAR(10) NULL
    COMMENT 'Nível de impacto: ALTO ou BAIXO',
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL
    COMMENT 'URL ou Base64 da imagem ilustrativa do impacto';

-- 2. Create learning sheets table
CREATE TABLE IF NOT EXISTS tutoria_learning_sheets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    error_id INT NOT NULL,
    tutorado_id INT NOT NULL,
    created_by_id INT NOT NULL,
    title VARCHAR(300) NOT NULL,
    error_summary TEXT NOT NULL,
    root_cause TEXT NULL,
    correct_procedure TEXT NULL,
    key_learnings TEXT NULL,
    reference_material TEXT NULL,
    acknowledgment_note TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    read_at DATETIME NULL,
    acknowledged_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ls_error FOREIGN KEY (error_id) REFERENCES tutoria_errors(id) ON DELETE CASCADE,
    CONSTRAINT fk_ls_tutorado FOREIGN KEY (tutorado_id) REFERENCES users(id),
    CONSTRAINT fk_ls_creator FOREIGN KEY (created_by_id) REFERENCES users(id),
    INDEX idx_ls_error (error_id),
    INDEX idx_ls_tutorado (tutorado_id),
    INDEX idx_ls_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
