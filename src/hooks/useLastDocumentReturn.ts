import { useCallback } from 'react';
import { isTauri } from '../lib/tauri';
import { initDb } from '../store/db';
import { listAllFiles } from '../store/files.store';

export function useLastDocumentReturn(onOpenEditor: (fileId: string) => void) {
  const openLastDocument = useCallback(async () => {
    if (!isTauri()) {
      return;
    }

    await initDb();
    const [lastDocument] = await listAllFiles();

    if (lastDocument) {
      onOpenEditor(lastDocument.id);
    }
  }, [onOpenEditor]);

  return { openLastDocument };
}
