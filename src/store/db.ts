import Database from '@tauri-apps/plugin-sql';

export const DB_URI = 'sqlite:loci.db';

let database: Database | null = null;

type TableColumn = {
  name: string;
};

async function tableHasColumn(db: Database, table: string, column: string): Promise<boolean> {
  const columns = await db.select<TableColumn[]>(`PRAGMA table_info(${table})`);
  return columns.some((entry) => entry.name === column);
}

async function addColumnIfMissing(
  db: Database,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  if (await tableHasColumn(db, table, column)) {
    return;
  }

  await db.execute(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
}

async function ensureSchema(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL UNIQUE,
      title TEXT,
      opened_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS atoms (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      source_text TEXT NOT NULL,
      group_label TEXT,
      span_start INTEGER,
      span_end INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      span_start INTEGER NOT NULL,
      span_end INTEGER NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('ai', 'paste')),
      created_at INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS onboarding (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);

  await addColumnIfMissing(
    db,
    'atoms',
    'type',
    "type TEXT NOT NULL DEFAULT 'note' CHECK(type IN ('definition', 'note', 'reminder'))",
  );
  await addColumnIfMissing(db, 'files', 'edited_at', 'edited_at INTEGER NOT NULL DEFAULT 0');
  await db.execute('UPDATE files SET edited_at = opened_at WHERE edited_at = 0');
  await addColumnIfMissing(db, 'files', 'pinned', 'pinned INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'atoms', 'reminder_due_at', 'reminder_due_at INTEGER');
  await addColumnIfMissing(db, 'atoms', 'reminder_surfaced_at', 'reminder_surfaced_at INTEGER');
}

export async function initDb(): Promise<Database> {
  if (database) {
    return database;
  }

  database = await Database.load(DB_URI);
  await ensureSchema(database);
  return database;
}

export async function getDb(): Promise<Database> {
  if (!database) {
    throw new Error('Database not initialized. Call initDb() first.');
  }

  return database;
}
