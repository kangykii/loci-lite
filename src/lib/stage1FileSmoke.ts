import { defaultNewNoteMarkdown } from './documentMeta';
import { createNote, getNotesDir, readFile, writeFile } from './tauri';

/**
 * Dev-only smoke test for Stage 1. Call from the Tauri webview console:
 *   import('/src/lib/stage1FileSmoke.ts').then((m) => m.runStage1FileSmoke())
 */
export async function runStage1FileSmoke(): Promise<void> {
  const notesDir = await getNotesDir();
  const path = await createNote('untitled', defaultNewNoteMarkdown());
  const initial = await readFile(path);

  if (!initial.includes('# Untitled')) {
    throw new Error('create_note did not write expected markdown.');
  }

  await writeFile(path, '# Hello\n\nFrom Stage 1 smoke test.\n');
  const updated = await readFile(path);

  if (!updated.includes('# Hello')) {
    throw new Error('write_file did not persist markdown.');
  }

  console.info('[Stage 1] notes dir:', notesDir);
  console.info('[Stage 1] note path:', path);
  console.info('[Stage 1] OK — file I/O works.');
}
