CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  seller_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  price INT NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
