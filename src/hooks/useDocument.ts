import { useCallback, useEffect, useRef, useState } from 'react';
import { displayTitleFromMarkdown } from '../lib/documentMeta';
import { isTauri, readFile, writeFile } from '../lib/tauri';
import { initDb } from '../store/db';
import {
  getFileById,
  touchEditedAt,
  touchOpenedAt,
  updateTitle,
  type FileRecord,
} from '../store/files.store';

type DocumentState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; file: FileRecord; markdown: string }
  | { status: 'error'; message: string };

function filenameFromPath(path: string): string {
  return path.split(/[/\\]/).pop() ?? 'note.md';
}

export function useDocument(fileId: string | null) {
  const [state, setState] = useState<DocumentState>({ status: 'idle' });
  const fileRef = useRef<FileRecord | null>(null);

  useEffect(() => {
    if (!fileId) {
      fileRef.current = null;
      setState({ status: 'idle' });
      return;
    }

    if (!isTauri()) {
      setState({
        status: 'error',
        message: 'Documents open in the Loci Notepad desktop app.',
      });
      return;
    }

    let cancelled = false;

    const load = async () => {
      setState({ status: 'loading' });

      try {
        await initDb();
        const file = await getFileById(fileId);

        if (!file) {
          throw new Error('Document not found.');
        }

        const markdown = await readFile(file.path);
        const openedAt = Date.now();
        await touchOpenedAt(fileId, openedAt);

        if (cancelled) {
          return;
        }

        const openedFile = { ...file, openedAt };
        fileRef.current = openedFile;
        setState({ status: 'ready', file: openedFile, markdown });
      } catch (cause: unknown) {
        if (cancelled) {
          return;
        }

        const message = cause instanceof Error ? cause.message : 'Failed to open document';
        fileRef.current = null;
        setState({ status: 'error', message });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const save = useCallback(async (markdown: string) => {
    const file = fileRef.current;

    if (!file) {
      return;
    }

    await writeFile(file.path, markdown);

    const title = displayTitleFromMarkdown(markdown, filenameFromPath(file.path));
    const editedAt = Date.now();

    await updateTitle(file.id, title);
    await touchEditedAt(file.id, editedAt);

    const updatedFile = { ...file, title, editedAt };
    fileRef.current = updatedFile;
    setState((current) =>
      current.status === 'ready'
        ? { status: 'ready', file: updatedFile, markdown }
        : current,
    );
  }, []);

  return { state, save };
}
