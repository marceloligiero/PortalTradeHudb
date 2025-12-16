-- Database initialization script
-- Run this after creating the database

USE TradeHub;
GO

-- Create admin user (password: admin123)
-- This is the ONLY user created automatically. All other users must register via the application.
IF NOT EXISTS (SELECT * FROM users WHERE email = 'admin@tradehub.com')
BEGIN
    INSERT INTO users (email, full_name, hashed_password, role, is_active, is_pending)
    VALUES (
        'admin@tradehub.com',
        'Administrator',
        '$2b$12$Upkzk52NmiZVGR1Hpj3ZbOILGcwjRwhKhsXBJ5XZl/s26BOXDtSlW',  -- bcrypt hash for 'admin123'
        'ADMIN',
        1,
        0
    );
END
GO

-- NOTE: Trainer and Student users are NO LONGER created here.
-- Users must register through the application's registration page.
-- They can select whether they are "Formador" (Trainer) or "Formando" (Student).
-- Formadores must be validated by the Admin before they can fully access the system.

-- Create sample banks
IF NOT EXISTS (SELECT * FROM banks WHERE code = 'PT')
BEGIN
    INSERT INTO banks (code, name, country, is_active)
    VALUES 
        ('PT', 'Portugal', 'Portugal', 1),
        ('ES', 'Espanha', 'Spain', 1),
        ('UN', 'United Kingdom', 'United Kingdom', 1);
END
GO

-- Create sample products
IF NOT EXISTS (SELECT * FROM products WHERE code = 'FX')
BEGIN
    INSERT INTO products (code, name, description, is_active)
    VALUES 
        ('FX', 'Foreign Exchange', 'Currency trading and exchange services', 1),
        ('MM', 'Money Market', 'Short-term lending and borrowing', 1),
        ('DERIV', 'Derivatives', 'Financial derivatives products', 1);
END
GO

PRINT '✅ Initial data inserted successfully';
