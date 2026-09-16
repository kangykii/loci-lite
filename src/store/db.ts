import Database from '@tauri-apps/plugin-sql';

export const DB_URI = 'sqlite:loci.db';

let database: Database | null = null;
let initPromise: Promise<Database> | null = null;

async function ensureSchema(db: Database): Promise<void> {
  // `files`/`atoms` schema now lives in Rust (crates/loci-core/src/schema.rs),
  // applied by src-tauri at startup - it's the sole owner so the app's Tauri
  // commands and loci-mcp's MCP tools share one migration path instead of two.
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
}

export async function initDb(): Promise<Database> {
  if (database) {
    return database;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const db = await Database.load(DB_URI);
      await ensureSchema(db);
      database = db;
      return db;
    })().catch((error: unknown) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

export async function getDb(): Promise<Database> {
  if (!database) {
    throw new Error('Database not initialized. Call initDb() first.');
  }

  return database;
}
