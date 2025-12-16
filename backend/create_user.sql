USE [master]
GO
-- Create Login
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'TradeHubUser')
BEGIN
    CREATE LOGIN [TradeHubUser] WITH PASSWORD=N'TradeHub@2025', DEFAULT_DATABASE=[TradeDataHub], CHECK_EXPIRATION=OFF, CHECK_POLICY=OFF
END
GO

USE [TradeDataHub]
GO
-- Create User in Database
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'TradeHubUser')
BEGIN
    CREATE USER [TradeHubUser] FOR LOGIN [TradeHubUser]
END
GO

-- Add to db_owner role
ALTER ROLE [db_owner] ADD MEMBER [TradeHubUser]
GO
