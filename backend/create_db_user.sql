USE master;
GO
-- Create login if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'tradehub_app')
BEGIN
    CREATE LOGIN tradehub_app WITH PASSWORD = 'AppPassword123!';
END
GO

USE etldata4you;
GO
-- Create user for the login
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'tradehub_app')
BEGIN
    CREATE USER tradehub_app FOR LOGIN tradehub_app;
END
GO

-- Add user to db_owner role to ensure full permissions
ALTER ROLE db_owner ADD MEMBER tradehub_app;
GO
