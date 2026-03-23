-- V009: Normalizar collation das tabelas DW para utf8mb4_unicode_ci
--
-- Problema: No HP, MySQL 8.0 cria tabelas com utf8mb4_0900_ai_ci por defeito.
-- As tabelas DW (dw_dim_*, dw_fact_*) sao criadas pelo SQLAlchemy sem collation
-- explicita, ficando com 0900_ai_ci. As tabelas de source (tutoria_errors, etc.)
-- foram criadas pelo V001 com utf8mb4_unicode_ci.
-- JOINs entre colunas de collations diferentes causam erro 1267.
--
-- Fix: ALTER TABLE para converter todas as tabelas DW e garantir consistencia.
-- No Docker (onde todas ja sao unicode_ci), este script e um no-op.

ALTER DATABASE tradehub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabelas de dimensao DW
ALTER TABLE dw_dim_date       CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE dw_dim_user       CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE dw_dim_course     CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE dw_dim_status     CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE dw_dim_team       CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE dw_dim_error_category CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabelas de factos DW
ALTER TABLE dw_fact_training        CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE dw_fact_tutoria         CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE dw_fact_chamados        CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE dw_fact_internal_errors CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE dw_fact_daily_snapshot  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
