import Database from '@tauri-apps/plugin-sql';

export const DB_URI = 'sqlite:loci.db';

let database: Database | null = null;

export async function initDb(): Promise<Database> {
  if (database) {
    return database;
  }

  database = await Database.load(DB_URI);
  return database;
}

export async function getDb(): Promise<Database> {
  if (!database) {
    throw new Error('Database not initialized. Call initDb() first.');
  }

  return database;
}
