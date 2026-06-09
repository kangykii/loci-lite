import { useEffect, useState } from 'react';
import { isTauri } from '../lib/tauri';
import { initDb } from '../store/db';
import { getFileById } from '../store/files.store';

export function useDocumentTitles(fileIds: string[]) {
  const [titles, setTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    const uniqueIds = [...new Set(fileIds.filter(Boolean))];

    if (!isTauri() || uniqueIds.length === 0) {
      setTitles({});
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await initDb();

        const entries = await Promise.all(
          uniqueIds.map(async (id) => {
            const file = await getFileById(id);
            return [id, file?.title ?? 'Untitled'] as const;
          }),
        );

        if (!cancelled) {
          setTitles(Object.fromEntries(entries));
        }
      } catch {
        if (!cancelled) {
          setTitles({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileIds]);

  return titles;
}
