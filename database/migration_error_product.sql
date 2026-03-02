-- Migration: add product_id (serviço) to tutoria_errors
-- Run: mysql -u root tradehub < database/migration_error_product.sql

ALTER TABLE tutoria_errors
  ADD COLUMN product_id INT NULL AFTER category_id,
  ADD INDEX idx_tutoria_errors_product (product_id),
  ADD CONSTRAINT fk_tutoria_errors_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE SET NULL;
