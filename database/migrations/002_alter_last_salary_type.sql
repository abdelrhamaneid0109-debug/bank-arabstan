ALTER TABLE users
  ALTER COLUMN last_salary TYPE BIGINT USING last_salary::BIGINT;
