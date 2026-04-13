CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  action TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
