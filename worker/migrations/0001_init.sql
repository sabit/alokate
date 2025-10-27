-- Schema for persisting unified scheduler state and snapshots
CREATE TABLE IF NOT EXISTS unified_state (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY,
  snapshot_name TEXT,
  timestamp TEXT NOT NULL,
  hash TEXT,
  data TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
