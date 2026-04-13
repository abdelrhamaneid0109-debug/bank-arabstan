const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function createUser(id) {
  return pool.query(
    `INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
    [id]
  );
}

function getUser(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((res) => res.rows[0]);
}

function updateUser(id, user) {
  return pool.query(
    `UPDATE users SET copper = $1, silver = $2, gold = $3, last_salary = $4 WHERE id = $5`,
    [user.copper, user.silver, user.gold, user.last_salary ?? 0, id]
  );
}

module.exports = { createUser, getUser, updateUser };
