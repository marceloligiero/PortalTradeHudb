DELETE FROM users WHERE email = 'admin@tradehub.com';
INSERT INTO users (email, full_name, hashed_password, role, is_active, is_pending, created_at, updated_at) 
VALUES ('admin@tradehub.com', 'Administrator', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koQvpYnvKWzm', 'ADMIN', 1, 0, NOW(), NOW());
