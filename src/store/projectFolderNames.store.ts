import { getDb } from './db';

const PROJECT_FOLDER_NAME_PREFIX = 'project_folder_name:';

function projectFolderNameKey(groupLabel: string): string {
  return `${PROJECT_FOLDER_NAME_PREFIX}${groupLabel}`;
}

export async function getProjectFolderNames(
  groupLabels: string[],
): Promise<Record<string, string>> {
  if (groupLabels.length === 0) {
    return {};
  }

  const db = await getDb();
  const uniqueLabels = [...new Set(groupLabels)];
  const placeholders = uniqueLabels.map((_, index) => `$${index + 1}`).join(', ');
  const rows = await db.select<{ key: string; value: string }[]>(
    `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
    uniqueLabels.map(projectFolderNameKey),
  );

  const names: Record<string, string> = {};
  for (const row of rows) {
    names[row.key.slice(PROJECT_FOLDER_NAME_PREFIX.length)] = row.value;
  }
  return names;
}

export async function setProjectFolderName(groupLabel: string, name: string): Promise<void> {
  const db = await getDb();
  await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)', [
    projectFolderNameKey(groupLabel),
    name,
  ]);
}

export async function deleteProjectFolderName(groupLabel: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM settings WHERE key = $1', [projectFolderNameKey(groupLabel)]);
}
