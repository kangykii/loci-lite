import { useCallback, useEffect, useRef, useState } from 'react';
import { takeSeededDocument } from '../lib/documentOpenCache';
import { isTauri, readFile, writeFile } from '../lib/tauri';
import { initDb } from '../store/db';
import {
  openFile,
  touchEditedAt,
  updateTitle,
  type FileRecord,
} from '../store/files.store';

type DocumentState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; file: FileRecord; markdown: string }
  | { status: 'error'; message: string };

export function useDocument(fileId: string | null) {
  const [state, setState] = useState<DocumentState>({ status: 'idle' });
  const fileRef = useRef<FileRecord | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  // StrictMode double-invokes this effect in dev (mount → cleanup → mount).
  // The seed cache is one-shot and gets consumed on the first pass, so the
  // second pass would miss it and fall through to a real fetch — a StrictMode-
  // only flicker on every freshly created note. This ref survives both passes
  // (refs aren't reset between them) and re-serves the same seed.
  const resolvedSeedRef = useRef<{ fileId: string; file: FileRecord; markdown: string } | null>(
    null,
  );

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
        const seeded =
          takeSeededDocument(fileId) ??
          (resolvedSeedRef.current?.fileId === fileId ? resolvedSeedRef.current : null);

        if (seeded) {
          resolvedSeedRef.current = { fileId, file: seeded.file, markdown: seeded.markdown };
          fileRef.current = seeded.file;
          setState({ status: 'ready', file: seeded.file, markdown: seeded.markdown });
          return;
        }

        await initDb();
        const openedAt = Date.now();
        const file = await openFile(fileId, openedAt);

        if (!file) {
          throw new Error('Document not found.');
        }

        const markdown = await readFile(file.path);

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

  const save = useCallback((markdown: string): Promise<void> => {
    const file = fileRef.current;

    if (!file) {
      return Promise.resolve();
    }
    const next = saveQueueRef.current.catch(() => undefined).then(async () => {
      await writeFile(file.path, markdown);
      const editedAt = Date.now();
      await touchEditedAt(file.id, editedAt);
      const updatedFile = { ...fileRef.current!, editedAt };
      fileRef.current = updatedFile;
      setState((current) =>
        current.status === 'ready'
          ? { status: 'ready', file: updatedFile, markdown }
          : current,
      );
    });
    saveQueueRef.current = next;
    return next;
  }, []);

  const renameTitle = useCallback(async (title: string | null) => {
    const file = fileRef.current;

    if (!file) {
      return;
    }

    await updateTitle(file.id, title);

    const updatedFile = { ...file, title };
    fileRef.current = updatedFile;
    setState((current) =>
      current.status === 'ready'
        ? { status: 'ready', file: updatedFile, markdown: current.markdown }
        : current,
    );
  }, []);

  return { state, save, renameTitle, waitForSaves: () => saveQueueRef.current };
}
