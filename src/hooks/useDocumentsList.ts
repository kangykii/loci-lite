import { useCallback, useState } from 'react';
import { displayTitleForFile } from '../lib/documentMeta';
import { formatOpenedAt } from '../lib/formatRelativeTime';
import { isTauri } from '../lib/tauri';
import { initDb } from '../store/db';
import { listAllFiles } from '../store/files.store';

export type DocumentListRow = {
  id: string;
  title: string;
  meta: string;
};

type DocumentsListStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useDocumentsList() {
  const [documents, setDocuments] = useState<DocumentListRow[]>([]);
  const [status, setStatus] = useState<DocumentsListStatus>('idle');
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
      const records = await listAllFiles();

      setDocuments(
        records.map((file) => ({
          id: file.id,
          title: displayTitleForFile(file.title, file.path),
          meta: formatOpenedAt(file.openedAt),
        })),
      );
      setStatus('ready');
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Failed to load documents';
      setError(message);
      setDocuments([]);
      setStatus('error');
    }
  }, []);

  return { documents, status, error, refresh };
}
