import { getDb } from './db';

export type FileRecord = {
  id: string;
  path: string;
  title: string | null;
  openedAt: number;
  createdAt: number;
  editedAt: number;
  pinned: boolean;
  projectGroupLabel: string | null;
};

type FileRow = {
  id: string;
  path: string;
  title: string | null;
  opened_at: number;
  created_at: number;
  edited_at: number;
  pinned?: number;
  project_group_label?: string | null;
};

function mapFile(row: FileRow): FileRecord {
  return {
    id: row.id,
    path: row.path,
    title: row.title,
    openedAt: row.opened_at,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    pinned: row.pinned === 1,
    projectGroupLabel: row.project_group_label ?? null,
  };
}

export async function insertFile(record: FileRecord): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO files (id, path, title, opened_at, created_at, edited_at, pinned, project_group_label) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [
      record.id,
      record.path,
      record.title,
      record.openedAt,
      record.createdAt,
      record.editedAt,
      record.pinned ? 1 : 0,
      record.projectGroupLabel,
    ],
  );
}

export async function getFileById(id: string): Promise<FileRecord | null> {
  const db = await getDb();
  const rows = await db.select<FileRow[]>('SELECT * FROM files WHERE id = $1', [id]);
  const row = rows[0];
  return row ? mapFile(row) : null;
}

export async function touchOpenedAt(id: string, openedAt: number): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE files SET opened_at = $1 WHERE id = $2', [openedAt, id]);
}

export async function touchEditedAt(id: string, editedAt: number): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE files SET edited_at = $1 WHERE id = $2', [editedAt, id]);
}

export async function updateTitle(id: string, title: string | null): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE files SET title = $1 WHERE id = $2', [title, id]);
}

export async function setFilePinned(id: string, pinned: boolean): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE files SET pinned = $1 WHERE id = $2', [pinned ? 1 : 0, id]);
}

export async function updateFilesProjectGroupLabel(
  ids: string[],
  projectGroupLabel: string | null,
): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  const db = await getDb();
  const placeholders = ids.map((_, index) => `$${index + 2}`).join(', ');
  await db.execute(`UPDATE files SET project_group_label = $1 WHERE id IN (${placeholders})`, [
    projectGroupLabel,
    ...ids,
  ]);
}

export async function clearSingletonProjectGroupLabel(groupLabel: string): Promise<void> {
  const db = await getDb();
  const rows = await db.select<{ id: string }[]>(
    'SELECT id FROM files WHERE project_group_label = $1',
    [groupLabel],
  );

  if (rows.length === 1) {
    await db.execute('UPDATE files SET project_group_label = NULL WHERE id = $1', [rows[0].id]);
  }
}

export async function listRecentFiles(limit: number): Promise<FileRecord[]> {
  const db = await getDb();
  const rows = await db.select<FileRow[]>(
    'SELECT * FROM files ORDER BY pinned DESC, opened_at DESC LIMIT $1',
    [limit],
  );
  return rows.map(mapFile);
}

export async function listAllFiles(): Promise<FileRecord[]> {
  const db = await getDb();
  const rows = await db.select<FileRow[]>(
    'SELECT * FROM files ORDER BY pinned DESC, opened_at DESC',
  );
  return rows.map(mapFile);
}

export async function listFilesByEditedAt(): Promise<FileRecord[]> {
  const db = await getDb();
  const rows = await db.select<FileRow[]>('SELECT * FROM files ORDER BY edited_at DESC');
  return rows.map(mapFile);
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM files WHERE id = $1', [id]);
}
