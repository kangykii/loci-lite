import { getDb } from './db';
export type { AnnotationRecord } from './annotationTypes';
import type { AnnotationRecord, AnnotationRow } from './annotationTypes';
function mapAnnotation(row: AnnotationRow): AnnotationRecord {
  return {
    id: row.id,
    fileId: row.file_id,
    spanStart: row.span_start,
    spanEnd: row.span_end,
    source: row.source,
    createdAt: row.created_at,
    coordinateSystem: 'visible_text',
  };
}

export async function createAnnotation(
  ann: Omit<AnnotationRecord, 'createdAt' | 'coordinateSystem'>,
): Promise<void> {
  const db = await getDb();
  const createdAt = Date.now();
  await db.execute(
    `INSERT INTO annotations (
       id, file_id, span_start, span_end, source, created_at, coordinate_system
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'visible_text')`,
    [ann.id, ann.fileId, ann.spanStart, ann.spanEnd, ann.source, createdAt],
  );
}

export async function listAnnotationsForFile(
  fileId: string,
): Promise<AnnotationRecord[]> {
  const db = await getDb();
  const rows = await db.select<AnnotationRow[]>(
    `SELECT * FROM annotations
     WHERE file_id = $1 AND coordinate_system = 'visible_text'
     ORDER BY span_start ASC`,
    [fileId],
  );
  return rows.map(mapAnnotation);
}

export async function deleteAnnotation(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM annotations WHERE id = $1', [id]);
}

async function insertAnnotationRecord(
  ann: Omit<AnnotationRecord, 'createdAt' | 'coordinateSystem'>,
  createdAt: number,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO annotations (
       id, file_id, span_start, span_end, source, created_at, coordinate_system
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'visible_text')`,
    [ann.id, ann.fileId, ann.spanStart, ann.spanEnd, ann.source, createdAt],
  );
}

function makeAnnotationId(): string {
  return crypto.randomUUID();
}

export async function subtractAnnotationRange(
  id: string,
  removeStart: number,
  removeEnd: number,
): Promise<AnnotationRecord[]> {
  const db = await getDb();
  const rows = await db.select<AnnotationRow[]>(
    `SELECT * FROM annotations
     WHERE id = $1 AND coordinate_system = 'visible_text'`,
    [id],
  );
  const existing = rows[0] ? mapAnnotation(rows[0]) : null;

  if (!existing) {
    return [];
  }

  const start = Math.max(existing.spanStart, removeStart);
  const end = Math.min(existing.spanEnd, removeEnd);
  if (start >= end) {
    return [existing];
  }

  const replacements: AnnotationRecord[] = [];
  if (existing.spanStart < start) {
    replacements.push({
      ...existing,
      id: makeAnnotationId(),
      spanEnd: start,
    });
  }

  if (end < existing.spanEnd) {
    replacements.push({
      ...existing,
      id: makeAnnotationId(),
      spanStart: end,
    });
  }

  await db.execute('DELETE FROM annotations WHERE id = $1', [id]);
  for (const replacement of replacements) {
    await insertAnnotationRecord(replacement, replacement.createdAt);
  }

  return replacements;
}

export async function replaceAnnotationsForFile(
  fileId: string,
  annotations: Omit<AnnotationRecord, 'fileId' | 'createdAt' | 'coordinateSystem'>[],
): Promise<AnnotationRecord[]> {
  const db = await getDb();
  const existingRows = await db.select<AnnotationRow[]>(
    `SELECT * FROM annotations
     WHERE file_id = $1 AND coordinate_system = 'visible_text'`,
    [fileId],
  );
  const existingCreatedAt = new Map(
    existingRows.map((row) => [row.id, row.created_at]),
  );

  await db.execute(
    `DELETE FROM annotations
     WHERE file_id = $1 AND coordinate_system = 'visible_text'`,
    [fileId],
  );

  const now = Date.now();
  const records = annotations
    .filter((annotation) => annotation.spanStart < annotation.spanEnd)
    .map((annotation) => ({
      ...annotation,
      fileId,
      createdAt: existingCreatedAt.get(annotation.id) ?? now,
      coordinateSystem: 'visible_text' as const,
    }));

  for (const record of records) {
    await insertAnnotationRecord(record, record.createdAt);
  }

  return records;
}

