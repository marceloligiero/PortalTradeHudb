-- Migration: Add password reset tokens table
-- Date: 2025-01-20

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Cleanup job: Remove expired/used tokens older than 7 days
-- This can be run periodically or through a scheduled job
-- DELETE FROM password_reset_tokens WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
