-- Script de atualização do banco de dados TradeDataHub
-- Garante que todas as tabelas e relacionamentos estão corretos

USE TradeDataHub;
GO

-- Verificar e criar tabela users se não existir
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id INT PRIMARY KEY IDENTITY(1,1),
        email NVARCHAR(255) NOT NULL UNIQUE,
        full_name NVARCHAR(255) NOT NULL,
        hashed_password NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        is_pending BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2
    );
    CREATE INDEX IX_users_email ON users(email);
    PRINT 'Tabela users criada com sucesso';
END
ELSE
BEGIN
    PRINT 'Tabela users já existe';
    
    -- Verificar se coluna is_pending existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'is_pending')
    BEGIN
        ALTER TABLE users ADD is_pending BIT NOT NULL DEFAULT 0;
        PRINT 'Coluna is_pending adicionada à tabela users';
    END
END
GO

-- Criar tabela banks
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[banks]') AND type in (N'U'))
BEGIN
    CREATE TABLE banks (
        id INT PRIMARY KEY IDENTITY(1,1),
        code NVARCHAR(10) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL,
        country NVARCHAR(50) NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabela banks criada com sucesso';
END
GO

-- Criar tabela products
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
BEGIN
    CREATE TABLE products (
        id INT PRIMARY KEY IDENTITY(1,1),
        code NVARCHAR(50) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(MAX),
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabela products criada com sucesso';
END
GO

-- Criar tabela courses
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[courses]') AND type in (N'U'))
BEGIN
    CREATE TABLE courses (
        id INT PRIMARY KEY IDENTITY(1,1),
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        bank_id INT NOT NULL,
        product_id INT NOT NULL,
        created_by INT NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2,
        FOREIGN KEY (bank_id) REFERENCES banks(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
    PRINT 'Tabela courses criada com sucesso';
END
GO

-- Criar tabela lessons
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[lessons]') AND type in (N'U'))
BEGIN
    CREATE TABLE lessons (
        id INT PRIMARY KEY IDENTITY(1,1),
        course_id INT NOT NULL,
        title NVARCHAR(255) NOT NULL,
        content NVARCHAR(MAX),
        order_index INT DEFAULT 0,
        estimated_minutes INT DEFAULT 30,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
    PRINT 'Tabela lessons criada com sucesso';
END
GO

-- Criar tabela training_plans
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[training_plans]') AND type in (N'U'))
BEGIN
    CREATE TABLE training_plans (
        id INT PRIMARY KEY IDENTITY(1,1),
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        created_by INT NOT NULL,
        trainer_id INT NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (trainer_id) REFERENCES users(id)
    );
    PRINT 'Tabela training_plans criada com sucesso';
END
GO

-- Criar tabela training_plan_courses
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[training_plan_courses]') AND type in (N'U'))
BEGIN
    CREATE TABLE training_plan_courses (
        id INT PRIMARY KEY IDENTITY(1,1),
        training_plan_id INT NOT NULL,
        course_id INT NOT NULL,
        order_index INT DEFAULT 0,
        use_custom BIT DEFAULT 0,
        custom_title NVARCHAR(255),
        custom_description NVARCHAR(MAX),
        FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id)
    );
    PRINT 'Tabela training_plan_courses criada com sucesso';
END
GO

-- Criar tabela training_plan_assignments
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[training_plan_assignments]') AND type in (N'U'))
BEGIN
    CREATE TABLE training_plan_assignments (
        id INT PRIMARY KEY IDENTITY(1,1),
        training_plan_id INT NOT NULL,
        user_id INT NOT NULL,
        assigned_by INT NOT NULL,
        assigned_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        completed_at DATETIME2,
        FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (assigned_by) REFERENCES users(id)
    );
    PRINT 'Tabela training_plan_assignments criada com sucesso';
END
GO

-- Criar tabela enrollments
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[enrollments]') AND type in (N'U'))
BEGIN
    CREATE TABLE enrollments (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        course_id INT NOT NULL,
        enrolled_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        completed_at DATETIME2,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
    );
    PRINT 'Tabela enrollments criada com sucesso';
END
GO

-- Criar tabela lesson_progress
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[lesson_progress]') AND type in (N'U'))
BEGIN
    CREATE TABLE lesson_progress (
        id INT PRIMARY KEY IDENTITY(1,1),
        enrollment_id INT NOT NULL,
        lesson_id INT NOT NULL,
        started_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        completed_at DATETIME2,
        actual_time_minutes INT,
        estimated_minutes INT DEFAULT 30,
        mpu FLOAT,
        mpu_percentage FLOAT,
        is_approved BIT DEFAULT 0,
        status NVARCHAR(50) DEFAULT 'IN_PROGRESS',
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );
    PRINT 'Tabela lesson_progress criada com sucesso';
END
GO

-- Criar tabela challenges
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[challenges]') AND type in (N'U'))
BEGIN
    CREATE TABLE challenges (
        id INT PRIMARY KEY IDENTITY(1,1),
        course_id INT NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        operations_required INT DEFAULT 100,
        time_per_operation FLOAT DEFAULT 1.0,
        created_by INT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
    PRINT 'Tabela challenges criada com sucesso';
END
GO

-- Criar tabela challenge_submissions
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[challenge_submissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE challenge_submissions (
        id INT PRIMARY KEY IDENTITY(1,1),
        challenge_id INT NOT NULL,
        user_id INT NOT NULL,
        started_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        submitted_at DATETIME2,
        operations_performed INT DEFAULT 0,
        actual_time_minutes INT,
        mpu FLOAT,
        mpu_percentage FLOAT,
        is_approved BIT DEFAULT 0,
        feedback NVARCHAR(MAX),
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    PRINT 'Tabela challenge_submissions criada com sucesso';
END
GO

-- Adicionar coluna max_errors em challenges se não existir
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[challenges]') AND name = 'max_errors')
BEGIN
    ALTER TABLE challenges ADD max_errors INT NOT NULL DEFAULT 0;
    PRINT 'Coluna max_errors adicionada à tabela challenges';
END
GO

-- Adicionar coluna errors_count em challenge_submissions se não existir
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[challenge_submissions]') AND name = 'errors_count')
BEGIN
    ALTER TABLE challenge_submissions ADD errors_count INT NOT NULL DEFAULT 0;
    PRINT 'Coluna errors_count adicionada à tabela challenge_submissions';
END
GO

-- Criar tabela certificates
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[certificates]') AND type in (N'U'))
BEGIN
    CREATE TABLE certificates (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        training_plan_id INT NOT NULL,
        certificate_number NVARCHAR(50) NOT NULL UNIQUE,
        issued_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        student_name NVARCHAR(255) NOT NULL,
        student_email NVARCHAR(255) NOT NULL,
        training_plan_title NVARCHAR(255) NOT NULL,
        total_hours FLOAT NOT NULL,
        courses_completed INT DEFAULT 0,
        average_mpu FLOAT DEFAULT 0,
        average_approval_rate FLOAT DEFAULT 0,
        is_valid BIT DEFAULT 1,
        revoked_at DATETIME2,
        revocation_reason NVARCHAR(MAX),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (training_plan_id) REFERENCES training_plans(id)
    );
    PRINT 'Tabela certificates criada com sucesso';
END
GO

-- Inserir dados iniciais se não existirem

-- Inserir admin se não existir
IF NOT EXISTS (SELECT * FROM users WHERE email = 'admin@tradehub.com')
BEGIN
    INSERT INTO users (email, full_name, hashed_password, role, is_active, is_pending)
    VALUES ('admin@tradehub.com', 'Administrator', 'admin123', 'ADMIN', 1, 0);
    PRINT 'Usuário admin criado com sucesso';
END
GO

-- Inserir bancos de exemplo
IF NOT EXISTS (SELECT * FROM banks WHERE code = 'CGD')
BEGIN
    INSERT INTO banks (code, name, country, is_active)
    VALUES 
        ('CGD', 'Caixa Geral de Depósitos', 'Portugal', 1),
        ('BPI', 'Banco BPI', 'Portugal', 1),
        ('NOVO', 'Novo Banco', 'Portugal', 1);
    PRINT 'Bancos de exemplo inseridos';
END
GO

-- Inserir produtos de exemplo
IF NOT EXISTS (SELECT * FROM products WHERE code = 'LOANS')
BEGIN
    INSERT INTO products (code, name, description, is_active)
    VALUES 
        ('LOANS', 'Crédito', 'Produtos de crédito habitação e pessoal', 1),
        ('ACCOUNTS', 'Contas', 'Contas à ordem e poupança', 1),
        ('CARDS', 'Cartões', 'Cartões de crédito e débito', 1),
        ('INVESTMENTS', 'Investimentos', 'Fundos e produtos de investimento', 1);
    PRINT 'Produtos de exemplo inseridos';
END
GO

PRINT 'Script de atualização concluído com sucesso!';
GO
