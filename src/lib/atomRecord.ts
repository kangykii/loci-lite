import type { AtomRecord, CreateAtomInput } from './atomTypes';
import { initDb } from '../store/db';
import { createAtom, updateAtom } from '../store/atoms.store';

// Id/timestamp/defaulting logic (previously `buildAtomRecord` here) now lives
// server-side in loci-core's create_atom, shared with loci-mcp's MCP tool.
export async function saveAtomRecord(input: CreateAtomInput): Promise<AtomRecord> {
  await initDb();
  return createAtom(input);
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
