import { useCallback, useState } from 'react';
import {
  defaultNewNoteMarkdown,
  slugify,
} from '../lib/documentMeta';
import { createNote } from '../lib/tauri';
import { seedDocument } from '../lib/documentOpenCache';
import { initDb } from '../store/db';
import { insertFile } from '../store/files.store';
import type { FileRecord } from '../store/files.store';

export function useCreateDocument() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNew = useCallback(async (): Promise<string> => {
    setIsCreating(true);
    setError(null);

    try {
      await initDb();
      const markdown = defaultNewNoteMarkdown();
      const path = await createNote(slugify('Untitled'), markdown);
      const now = Date.now();
      const id = crypto.randomUUID();
      const record: FileRecord = {
        id,
        path,
        title: null,
        openedAt: now,
        createdAt: now,
        editedAt: now,
        pinned: false,
        projectGroupLabel: null,
      };

      await insertFile(record);
      seedDocument(record, markdown);

      return id;
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Failed to create note';
      setError(message);
      throw cause;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { createNew, isCreating, error };
}
