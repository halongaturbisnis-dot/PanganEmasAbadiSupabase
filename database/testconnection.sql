-- SQL script to create a test table for Database connection verification
CREATE TABLE IF NOT EXISTS test_connection (
  id SERIAL PRIMARY KEY,
  test_name TEXT NOT NULL,
  test_value TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for testing
INSERT INTO test_connection (test_name, test_value) VALUES ('Connection Test', 'Successfully connected to Database');
INSERT INTO test_connection (test_name, test_value) VALUES ('Integrity Check', 'Schema is valid and writable');
