USE [etldata4you]
GO

IF NOT EXISTS (SELECT * FROM users WHERE email = 'admin@tradehub.com')
BEGIN
    INSERT INTO users (email, full_name, hashed_password, role, is_active, is_pending, created_at)
    VALUES ('admin@tradehub.com', 'System Admin', 'admin123', 'ADMIN', 1, 0, GETDATE());
    PRINT 'Admin user created.';
END
ELSE
BEGIN
    PRINT 'Admin user already exists.';
END
GO
