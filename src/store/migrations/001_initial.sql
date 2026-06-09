CREATE TABLE files (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  title TEXT,
  opened_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE atoms (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source_text TEXT NOT NULL,
  group_label TEXT,
  span_start INTEGER,
  span_end INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE annotations (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  span_start INTEGER NOT NULL,
  span_end INTEGER NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('ai', 'paste')),
  created_at INTEGER NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
