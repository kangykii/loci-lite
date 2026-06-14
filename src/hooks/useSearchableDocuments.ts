import { useCallback, useState } from 'react';
import {
  displayTitleForFile,
  excerptFromMarkdown,
} from '../lib/documentMeta';
import { formatOpenedAt } from '../lib/formatRelativeTime';
import { resurfaceDueReminders } from '../lib/resurfaceReminders';
import { isTauri, readFile } from '../lib/tauri';
import { initDb } from '../store/db';
import { listAllFiles } from '../store/files.store';

export type SearchableDocument = {
  id: string;
  path: string;
  title: string;
  meta: string;
  preview: string;
  haystack: string;
  pinned: boolean;
};

type SearchableDocumentsStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useSearchableDocuments() {
  const [documents, setDocuments] = useState<SearchableDocument[]>([]);
  const [status, setStatus] = useState<SearchableDocumentsStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isTauri()) {
      setDocuments([]);
      setStatus('ready');
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      await initDb();
      try {
        await resurfaceDueReminders();
      } catch (cause) {
        console.warn('Failed to resurface due reminders before document refresh', cause);
      }
      const records = await listAllFiles();

      const rows = await Promise.all(
        records.map(async (file) => {
          const title = displayTitleForFile(file.title, file.path);
          let markdown = '';

          try {
            markdown = await readFile(file.path);
          } catch {
            markdown = '';
          }

          const preview = excerptFromMarkdown(markdown);

          return {
            id: file.id,
            path: file.path,
            title,
            meta: formatOpenedAt(file.openedAt),
            preview,
            haystack: `${title}\n${markdown}`,
            pinned: file.pinned,
          };
        }),
      );

      setDocuments(rows);
      setStatus('ready');
    } catch (cause: unknown) {
      const message =
        cause instanceof Error ? cause.message : 'Failed to load searchable documents';
      setError(message);
      setDocuments([]);
      setStatus('error');
    }
  }, []);

  return { documents, status, error, refresh };
}
