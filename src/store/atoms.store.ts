import type { AtomRecord, AtomType } from '../lib/atomTypes';
import { getDb } from './db';

export type { AtomRecord, AtomType };

type AtomRow = {
  id: string;
  file_id: string;
  type: AtomType;
  question: string;
  answer: string;
  source_text: string;
  group_label: string | null;
  span_start: number | null;
  span_end: number | null;
  created_at: number;
};

function mapAtom(row: AtomRow): AtomRecord {
  return {
    id: row.id,
    fileId: row.file_id,
    type: row.type,
    question: row.question,
    answer: row.answer,
    sourceText: row.source_text,
    groupLabel: row.group_label,
    spanStart: row.span_start,
    spanEnd: row.span_end,
    createdAt: row.created_at,
  };
}

export async function createAtom(atom: AtomRecord): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO atoms (
      id, file_id, type, question, answer, source_text,
      group_label, span_start, span_end, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      atom.id,
      atom.fileId,
      atom.type,
      atom.question,
      atom.answer,
      atom.sourceText,
      atom.groupLabel,
      atom.spanStart,
      atom.spanEnd,
      atom.createdAt,
    ],
  );
}

export async function getAtomsForFile(fileId: string): Promise<AtomRecord[]> {
  const db = await getDb();
  const rows = await db.select<AtomRow[]>(
    'SELECT * FROM atoms WHERE file_id = $1 ORDER BY created_at DESC',
    [fileId],
  );
  return rows.map(mapAtom);
}

export async function getDefinitionAtoms(): Promise<AtomRecord[]> {
  const db = await getDb();
  const rows = await db.select<AtomRow[]>(
    "SELECT * FROM atoms WHERE type = 'definition' ORDER BY created_at DESC",
  );
  return rows.map(mapAtom);
}

export async function getAtomById(id: string): Promise<AtomRecord | null> {
  const db = await getDb();
  const rows = await db.select<AtomRow[]>('SELECT * FROM atoms WHERE id = $1', [id]);
  const row = rows[0];
  return row ? mapAtom(row) : null;
}

export async function deleteAtom(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM atoms WHERE id = $1', [id]);
}

export async function updateAtom(
  id: string,
  patch: { type: AtomType; answer: string; sourceText?: string },
): Promise<void> {
  const db = await getDb();
  const answer = patch.answer.trim();

  if (patch.sourceText !== undefined) {
    const sourceText = patch.sourceText.trim();
    await db.execute(
      'UPDATE atoms SET type = $1, answer = $2, question = $3, source_text = $4 WHERE id = $5',
      [patch.type, answer, sourceText, sourceText, id],
    );
    return;
  }

  await db.execute('UPDATE atoms SET type = $1, answer = $2 WHERE id = $3', [
    patch.type,
    answer,
    id,
  ]);
}

export async function updateAtomsGroupLabel(
  ids: string[],
  groupLabel: string | null,
): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  const db = await getDb();
  const placeholders = ids.map((_, index) => `$${index + 2}`).join(', ');

  await db.execute(`UPDATE atoms SET group_label = $1 WHERE id IN (${placeholders})`, [
    groupLabel,
    ...ids,
  ]);
}

export async function getAtomsByGroupLabel(groupLabel: string): Promise<AtomRecord[]> {
  const db = await getDb();
  const rows = await db.select<AtomRow[]>(
    'SELECT * FROM atoms WHERE group_label = $1 ORDER BY created_at ASC',
    [groupLabel],
  );

  return rows.map(mapAtom);
}

export async function clearSingletonGroupLabel(groupLabel: string): Promise<void> {
  const db = await getDb();
  const rows = await db.select<{ id: string }[]>(
    'SELECT id FROM atoms WHERE group_label = $1',
    [groupLabel],
  );

  if (rows.length === 1) {
    await db.execute('UPDATE atoms SET group_label = NULL WHERE id = $1', [rows[0].id]);
  }
}

export async function listAllAtoms(): Promise<AtomRecord[]> {
  const db = await getDb();
  const rows = await db.select<AtomRow[]>('SELECT * FROM atoms ORDER BY created_at DESC');
  return rows.map(mapAtom);
}
