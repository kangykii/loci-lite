import type { FileRecord } from '../store/files.store';

// One-shot seed so opening a note immediately after creating it skips the
// getFileById + readFile round trip for content useCreateDocument already has
// in memory. Consumed (deleted) on first read — a later open of the same note
// goes through the normal fetch path.
const seeds = new Map<string, { file: FileRecord; markdown: string }>();

export function seedDocument(file: FileRecord, markdown: string): void {
  seeds.set(file.id, { file, markdown });
}

export function takeSeededDocument(fileId: string): { file: FileRecord; markdown: string } | null {
  const seed = seeds.get(fileId);

  if (!seed) {
    return null;
  }

  seeds.delete(fileId);
  return seed;
}
