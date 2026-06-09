import { getDb } from './db';

const STACK_NAME_PREFIX = 'bookmark_stack_name:';

function stackNameKey(groupLabel: string): string {
  return `${STACK_NAME_PREFIX}${groupLabel}`;
}

export async function getStackDisplayName(groupLabel: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = $1',
    [stackNameKey(groupLabel)],
  );

  return rows[0]?.value ?? null;
}

export async function setStackDisplayName(groupLabel: string, name: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
    [stackNameKey(groupLabel), name],
  );
}

export async function getStackDisplayNames(
  groupLabels: string[],
): Promise<Record<string, string>> {
  if (groupLabels.length === 0) {
    return {};
  }

  const db = await getDb();
  const uniqueLabels = [...new Set(groupLabels)];
  const keys = uniqueLabels.map(stackNameKey);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  const rows = await db.select<{ key: string; value: string }[]>(
    `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
    keys,
  );

  const names: Record<string, string> = {};

  for (const row of rows) {
    const groupLabel = row.key.slice(STACK_NAME_PREFIX.length);
    names[groupLabel] = row.value;
  }

  return names;
}
