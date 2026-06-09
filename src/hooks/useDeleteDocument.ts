import { useCallback, useState } from 'react';
import { deleteFile as deleteFileOnDisk, isTauri } from '../lib/tauri';
import { initDb } from '../store/db';
import {
  deleteFile as deleteFileRecord,
  getFileById,
} from '../store/files.store';

export function useDeleteDocument() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (fileId: string): Promise<void> => {
    if (!isTauri()) {
      throw new Error('Documents can only be deleted in the Loci Notepad desktop app.');
    }

    setIsDeleting(true);
    setError(null);

    try {
      await initDb();
      const file = await getFileById(fileId);

      if (!file) {
        throw new Error('Document not found.');
      }

      await deleteFileOnDisk(file.path);
      await deleteFileRecord(fileId);
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Failed to delete document';
      setError(message);
      throw cause;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { remove, isDeleting, error, clearError };
}
