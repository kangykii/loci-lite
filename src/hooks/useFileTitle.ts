import { useEffect, useState } from 'react';
import { isTauri } from '../lib/tauri';
import { initDb } from '../store/db';
import { getFileById } from '../store/files.store';

export function useFileTitle(fileId: string | null) {
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId || !isTauri()) {
      setTitle(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await initDb();
        const file = await getFileById(fileId);
        if (!cancelled) {
          setTitle(file?.title ?? 'Untitled');
        }
      } catch {
        if (!cancelled) {
          setTitle('Untitled');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  return title;
}
