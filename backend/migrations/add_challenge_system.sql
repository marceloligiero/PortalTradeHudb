-- Migração para Sistema de Desafios com MPU
-- Adicionar colunas ao modelo Challenge

-- Adicionar campos ao Challenge
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenges' AND COLUMN_NAME = 'challenge_type')
    ALTER TABLE challenges ADD challenge_type VARCHAR(50) DEFAULT 'COMPLETE';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenges' AND COLUMN_NAME = 'time_limit_minutes')
    ALTER TABLE challenges ADD time_limit_minutes INT DEFAULT 60 NOT NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenges' AND COLUMN_NAME = 'target_mpu')
    ALTER TABLE challenges ADD target_mpu FLOAT NOT NULL DEFAULT 1.0;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenges' AND COLUMN_NAME = 'is_active')
    ALTER TABLE challenges ADD is_active BIT DEFAULT 1;

-- Remover colunas antigas não mais usadas
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenges' AND COLUMN_NAME = 'time_per_operation')
    ALTER TABLE challenges DROP COLUMN time_per_operation;

-- Criar tabela ChallengePart para desafios tipo COMPLETE
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'challenge_parts')
BEGIN
    CREATE TABLE challenge_parts (
        id INT PRIMARY KEY IDENTITY(1,1),
        challenge_id INT NOT NULL,
        submission_id INT NOT NULL,
        part_number INT NOT NULL,
        operations_count INT NOT NULL,
        started_at DATETIME2 NOT NULL,
        completed_at DATETIME2 NOT NULL,
        duration_minutes FLOAT,
        mpu FLOAT,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
        FOREIGN KEY (submission_id) REFERENCES challenge_submissions(id) ON DELETE CASCADE
    );
END

-- Atualizar tabela ChallengeSubmission
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'submission_type')
    ALTER TABLE challenge_submissions ADD submission_type VARCHAR(50) NOT NULL DEFAULT 'COMPLETE';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'total_operations')
    ALTER TABLE challenge_submissions ADD total_operations INT;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'total_time_minutes')
    ALTER TABLE challenge_submissions ADD total_time_minutes INT;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'calculated_mpu')
    ALTER TABLE challenge_submissions ADD calculated_mpu FLOAT;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'mpu_vs_target')
    ALTER TABLE challenge_submissions ADD mpu_vs_target FLOAT;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'score')
    ALTER TABLE challenge_submissions ADD score FLOAT;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'submitted_by')
    ALTER TABLE challenge_submissions ADD submitted_by INT FOREIGN KEY REFERENCES users(id);

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'completed_at')
    ALTER TABLE challenge_submissions ADD completed_at DATETIME2;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'updated_at')
    ALTER TABLE challenge_submissions ADD updated_at DATETIME2;

-- Remover colunas antigas
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'operations_performed')
    ALTER TABLE challenge_submissions DROP COLUMN operations_performed;

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'actual_time_minutes')
    ALTER TABLE challenge_submissions DROP COLUMN actual_time_minutes;

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'mpu')
    ALTER TABLE challenge_submissions DROP COLUMN mpu;

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'challenge_submissions' AND COLUMN_NAME = 'mpu_percentage')
    ALTER TABLE challenge_submissions DROP COLUMN mpu_percentage;

-- Atualizar tabela Lessons
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'lessons' AND COLUMN_NAME = 'description')
    ALTER TABLE lessons ADD description TEXT;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'lessons' AND COLUMN_NAME = 'lesson_type')
    ALTER TABLE lessons ADD lesson_type VARCHAR(50) DEFAULT 'THEORETICAL';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'lessons' AND COLUMN_NAME = 'video_url')
    ALTER TABLE lessons ADD video_url VARCHAR(500);

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'lessons' AND COLUMN_NAME = 'materials_url')
    ALTER TABLE lessons ADD materials_url VARCHAR(500);

-- Atualizar coluna estimated_minutes para NOT NULL se necessário
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'lessons' AND COLUMN_NAME = 'estimated_minutes' AND IS_NULLABLE = 'YES')
BEGIN
    -- Primeiro, atualizar valores NULL
    UPDATE lessons SET estimated_minutes = 30 WHERE estimated_minutes IS NULL;
    -- Depois alterar para NOT NULL
    ALTER TABLE lessons ALTER COLUMN estimated_minutes INT NOT NULL;
END

PRINT 'Migração concluída com sucesso!';
