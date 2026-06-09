import { defaultNewNoteMarkdown, slugify, titleFromMarkdown } from './documentMeta';
import { createNote } from './tauri';
import { initDb } from '../store/db';
import { getFileById, insertFile, listRecentFiles } from '../store/files.store';

/**
 * Dev-only smoke test for Stage 2. Call from the Tauri webview console:
 *   import('/src/lib/stage2RegistrySmoke.ts').then((m) => m.runStage2RegistrySmoke())
 */
export async function runStage2RegistrySmoke(): Promise<void> {
  await initDb();

  const id = crypto.randomUUID();
  const slug = slugify('Stage Two Note');
  const markdown = defaultNewNoteMarkdown();
  const path = await createNote(slug, markdown);
  const now = Date.now();
  const title = titleFromMarkdown(markdown) ?? 'Untitled';

  await insertFile({
    id,
    path,
    title,
    openedAt: now,
    createdAt: now,
    editedAt: now,
  });

  const record = await getFileById(id);
  if (!record || record.path !== path) {
    throw new Error('getFileById did not return the inserted row.');
  }

  const recent = await listRecentFiles(10);
  if (!recent.some((file) => file.id === id)) {
    throw new Error('listRecentFiles did not include the inserted file.');
  }

  console.info('[Stage 2] file id:', id);
  console.info('[Stage 2] file path:', path);
  console.info('[Stage 2] recent count:', recent.length);
  console.info('[Stage 2] OK — SQLite registry works.');
}
