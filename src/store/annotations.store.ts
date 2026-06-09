import { getDb } from './db';

export type AnnotationRecord = {
  id: string;
  fileId: string;
  spanStart: number;
  spanEnd: number;
  source: 'ai' | 'paste';
  createdAt: number;
};

type AnnotationRow = {
  id: string;
  file_id: string;
  span_start: number;
  span_end: number;
  source: 'ai' | 'paste';
  created_at: number;
};

function mapAnnotation(row: AnnotationRow): AnnotationRecord {
  return {
    id: row.id,
    fileId: row.file_id,
    spanStart: row.span_start,
    spanEnd: row.span_end,
    source: row.source,
    createdAt: row.created_at,
  };
}

export async function createAnnotation(
  ann: Omit<AnnotationRecord, 'createdAt'>,
): Promise<void> {
  const db = await getDb();
  const createdAt = Date.now();
  await db.execute(
    `INSERT INTO annotations (id, file_id, span_start, span_end, source, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [ann.id, ann.fileId, ann.spanStart, ann.spanEnd, ann.source, createdAt],
  );
}

export async function listAnnotationsForFile(
  fileId: string,
): Promise<AnnotationRecord[]> {
  const db = await getDb();
  const rows = await db.select<AnnotationRow[]>(
    'SELECT * FROM annotations WHERE file_id = $1 ORDER BY span_start ASC',
    [fileId],
  );
  return rows.map(mapAnnotation);
}

export async function deleteAnnotation(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM annotations WHERE id = $1', [id]);
}

async function insertAnnotationRecord(
  ann: Omit<AnnotationRecord, 'createdAt'>,
  createdAt: number,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO annotations (id, file_id, span_start, span_end, source, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
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
  const rows = await db.select<AnnotationRow[]>('SELECT * FROM annotations WHERE id = $1', [
    id,
  ]);
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
  annotations: Omit<AnnotationRecord, 'fileId' | 'createdAt'>[],
): Promise<AnnotationRecord[]> {
  const db = await getDb();
  await db.execute('DELETE FROM annotations WHERE file_id = $1', [fileId]);

  const createdAt = Date.now();
  const records = annotations
    .filter((annotation) => annotation.spanStart < annotation.spanEnd)
    .map((annotation) => ({
      ...annotation,
      fileId,
      createdAt,
    }));

  for (const record of records) {
    await insertAnnotationRecord(record, record.createdAt);
  }

  return records;
}

