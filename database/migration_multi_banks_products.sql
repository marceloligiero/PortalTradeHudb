-- Migration: Adicionar suporte a múltiplos bancos e produtos/serviços por curso e plano de formação
-- Data: 2026-02-04

-- ============== CRIAR TABELAS DE ASSOCIAÇÃO ==============

-- Tabela de associação curso-banco (muitos-para-muitos)
CREATE TABLE IF NOT EXISTS course_banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    bank_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_bank (course_id, bank_id)
);

-- Tabela de associação curso-produto (muitos-para-muitos)
CREATE TABLE IF NOT EXISTS course_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_product (course_id, product_id)
);

-- Tabela de associação plano-banco (muitos-para-muitos)
CREATE TABLE IF NOT EXISTS training_plan_banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_plan_id INT NOT NULL,
    bank_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_bank (training_plan_id, bank_id)
);

-- Tabela de associação plano-produto (muitos-para-muitos)
CREATE TABLE IF NOT EXISTS training_plan_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_plan_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_product (training_plan_id, product_id)
);

-- ============== MIGRAR DADOS EXISTENTES ==============

-- Migrar associações de cursos existentes (bank_id e product_id únicos para as novas tabelas)
INSERT IGNORE INTO course_banks (course_id, bank_id)
SELECT id, bank_id FROM courses WHERE bank_id IS NOT NULL;

INSERT IGNORE INTO course_products (course_id, product_id)
SELECT id, product_id FROM courses WHERE product_id IS NOT NULL;

-- Migrar associações de planos existentes
INSERT IGNORE INTO training_plan_banks (training_plan_id, bank_id)
SELECT id, bank_id FROM training_plans WHERE bank_id IS NOT NULL;

INSERT IGNORE INTO training_plan_products (training_plan_id, product_id)
SELECT id, product_id FROM training_plans WHERE product_id IS NOT NULL;

-- ============== TORNAR COLUNAS LEGADAS NULLABLE ==============

-- Permitir NULL nas colunas legacy de courses
ALTER TABLE courses MODIFY COLUMN bank_id INT NULL;
ALTER TABLE courses MODIFY COLUMN product_id INT NULL;

-- Permitir NULL nas colunas legacy de training_plans (já são nullable, mas garantir)
ALTER TABLE training_plans MODIFY COLUMN bank_id INT NULL;
ALTER TABLE training_plans MODIFY COLUMN product_id INT NULL;

-- ============== CRIAR ÍNDICES PARA PERFORMANCE ==============

CREATE INDEX idx_course_banks_course ON course_banks(course_id);
CREATE INDEX idx_course_banks_bank ON course_banks(bank_id);
CREATE INDEX idx_course_products_course ON course_products(course_id);
CREATE INDEX idx_course_products_product ON course_products(product_id);
CREATE INDEX idx_training_plan_banks_plan ON training_plan_banks(training_plan_id);
CREATE INDEX idx_training_plan_banks_bank ON training_plan_banks(bank_id);
CREATE INDEX idx_training_plan_products_plan ON training_plan_products(training_plan_id);
CREATE INDEX idx_training_plan_products_product ON training_plan_products(product_id);
