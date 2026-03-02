-- Migration: portal tutoria tables
-- Create tables for tutoring error tracking and action plans
CREATE TABLE IF NOT EXISTS tutoria_errors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reported_by INT,
  status VARCHAR(50) DEFAULT 'OPEN',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  INDEX (reported_by)
);

CREATE TABLE IF NOT EXISTS tutoria_action_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  error_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INT NULL,
  due_date DATETIME NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  FOREIGN KEY (error_id) REFERENCES tutoria_errors(id) ON DELETE CASCADE,
  INDEX (error_id),
  INDEX (assigned_to)
);

CREATE TABLE IF NOT EXISTS tutoria_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- End migration
