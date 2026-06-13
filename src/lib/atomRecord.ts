import type { AtomRecord, CreateAtomInput } from './atomTypes';
import { initDb } from '../store/db';
import { createAtom, updateAtom } from '../store/atoms.store';

export function buildAtomRecord(input: CreateAtomInput): AtomRecord {
  const sourceText = input.sourceText.trim();
  const answer = input.answer.trim();

  return {
    id: input.id ?? crypto.randomUUID(),
    fileId: input.fileId,
    type: input.type,
    question: sourceText,
    answer,
    sourceText,
    groupLabel: null,
    spanStart: input.spanStart,
    spanEnd: input.spanEnd,
    reminderDueAt: input.type === 'reminder' ? input.reminderDueAt ?? null : null,
    reminderSurfacedAt: null,
    createdAt: Date.now(),
  };
}

export async function saveAtomRecord(record: AtomRecord): Promise<void> {
  await initDb();
  await createAtom(record);
}

export async function updateAtomRecord(
  id: string,
  type: AtomRecord['type'],
  answer: string,
  sourceText?: string,
  reminderDueAt?: number | null,
): Promise<void> {
  await initDb();
  await updateAtom(id, { type, answer, sourceText, reminderDueAt });
}
