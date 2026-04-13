CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INT DEFAULT 1
);
