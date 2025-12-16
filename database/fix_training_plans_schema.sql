-- Script para sincronizar a tabela training_plans com o modelo Python
-- Remove colunas que não existem no modelo e garante que a estrutura está correta

USE TradeDataHub;
GO

PRINT 'Verificando e ajustando estrutura da tabela training_plans...';

-- Verificar se as colunas extras existem e removê-las se necessário
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[training_plans]') AND name = 'bank_code')
BEGIN
    PRINT 'Removendo coluna bank_code...';
    ALTER TABLE training_plans DROP COLUMN bank_code;
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[training_plans]') AND name = 'product_type')
BEGIN
    PRINT 'Removendo coluna product_type...';
    ALTER TABLE training_plans DROP COLUMN product_type;
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[training_plans]') AND name = 'start_date')
BEGIN
    PRINT 'Removendo coluna start_date...';
    ALTER TABLE training_plans DROP COLUMN start_date;
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[training_plans]') AND name = 'end_date')
BEGIN
    PRINT 'Removendo coluna end_date...';
    ALTER TABLE training_plans DROP COLUMN end_date;
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[training_plans]') AND name = 'max_students')
BEGIN
    PRINT 'Removendo coluna max_students...';
    ALTER TABLE training_plans DROP COLUMN max_students;
END

PRINT 'Estrutura da tabela training_plans sincronizada com sucesso!';
PRINT 'Colunas atuais: id, title, description, created_by, trainer_id, is_active, created_at, updated_at';
GO
