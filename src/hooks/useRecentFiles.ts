import { useCallback, useState } from 'react';
import {
  displayTitleForFile,
  excerptFromMarkdown,
} from '../lib/documentMeta';
import { formatOpenedAt } from '../lib/formatRelativeTime';
import { isTauri, readFile } from '../lib/tauri';
import { initDb } from '../store/db';
import { listRecentFiles } from '../store/files.store';

export type RecentFileRow = {
  id: string;
  title: string;
  dateLabel: string;
  preview: string;
};

type RecentFilesStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = useState<RecentFileRow[]>([]);
  const [status, setStatus] = useState<RecentFilesStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isTauri()) {
      setRecentFiles([]);
      setStatus('ready');
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      await initDb();
      const records = await listRecentFiles(10);

      const rows = await Promise.all(
        records.map(async (file) => {
          let preview = '';

          try {
            const markdown = await readFile(file.path);
            preview = excerptFromMarkdown(markdown);
          } catch {
            preview = '';
          }

          return {
            id: file.id,
            title: displayTitleForFile(file.title, file.path),
            dateLabel: formatOpenedAt(file.openedAt),
            preview,
          };
        }),
      );

      setRecentFiles(rows);
      setStatus('ready');
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Failed to load recent files';
      setError(message);
      setRecentFiles([]);
      setStatus('error');
    }
  }, []);

  return { recentFiles, status, error, refresh };
}
