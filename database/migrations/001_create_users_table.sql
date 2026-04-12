CREATE TABLE IF NOT EXISTS users (
  id          TEXT      PRIMARY KEY,
  copper      INTEGER   NOT NULL DEFAULT 0,
  silver      INTEGER   NOT NULL DEFAULT 0,
  gold        INTEGER   NOT NULL DEFAULT 0,
  last_salary INTEGER   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP NOT NULL DEFAULT now()
);
