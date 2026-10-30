CREATE TABLE employees (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT NOT NULL
);

CREATE TABLE leaves (
  id          INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  type        TEXT NOT NULL,
  start_date  TEXT NOT NULL,
  end_date    TEXT NOT NULL,
  days        INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'PENDING',
  created_at  TEXT NOT NULL
);

CREATE INDEX idx_leaves_employee ON leaves(employee_id);
