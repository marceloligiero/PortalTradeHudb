-- MySQL-compatible initialization script for TradeHub
-- Run this AFTER the backend has created the tables via SQLAlchemy

USE tradehub;

-- Create admin user (password: admin123)
INSERT IGNORE INTO users (email, full_name, hashed_password, role, is_active, is_pending)
VALUES (
    'admin@tradehub.com',
    'Administrator',
    '$2b$12$Upkzk52NmiZVGR1Hpj3ZbOILGcwjRwhKhsXBJ5XZl/s26BOXDtSlW',
    'ADMIN',
    1,
    0
);

-- Create sample banks
INSERT IGNORE INTO banks (code, name, country, is_active)
VALUES 
    ('PT', 'Portugal', 'Portugal', 1),
    ('ES', 'Espanha', 'Spain', 1),
    ('UN', 'United Kingdom', 'United Kingdom', 1);

-- Create sample products
INSERT IGNORE INTO products (code, name, description, is_active)
VALUES 
    ('FX', 'Foreign Exchange', 'Currency trading and exchange services', 1),
    ('MM', 'Money Market', 'Short-term lending and borrowing', 1),
    ('DERIV', 'Derivatives', 'Financial derivatives products', 1);

SELECT 'Initial data inserted successfully' AS status;
