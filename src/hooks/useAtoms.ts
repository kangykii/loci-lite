import { useCallback, useState } from 'react';
import { isTauri } from '../lib/tauri';
import { initDb } from '../store/db';
import type { AtomType } from '../lib/atomTypes';
import {
  clearSingletonGroupLabel,
  deleteAtom,
  getAtomById,
  updateAtom as updateAtomInStore,
  getAtomsForFile,
  getDefinitionAtoms,
  listAllAtoms,
  type AtomRecord,
} from '../store/atoms.store';

type AtomsStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useAtoms() {
  const [atoms, setAtoms] = useState<AtomRecord[]>([]);
  const [definitions, setDefinitions] = useState<AtomRecord[]>([]);
  const [status, setStatus] = useState<AtomsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const loadForFile = useCallback(async (fileId: string) => {
    if (!isTauri() || !fileId) {
      setAtoms([]);
      setStatus('ready');
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      await initDb();
      const rows = await getAtomsForFile(fileId);
      setAtoms(rows);
      setStatus('ready');
      bumpRefresh();
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Failed to load atoms';
      setError(message);
      setAtoms([]);
      setStatus('error');
    }
  }, [bumpRefresh]);

  const loadDefinitions = useCallback(async () => {
    if (!isTauri()) {
      setDefinitions([]);
      return;
    }

    try {
      await initDb();
      const rows = await getDefinitionAtoms();
      setDefinitions(rows);
    } catch (cause: unknown) {
      const message =
        cause instanceof Error ? cause.message : 'Failed to load definition atoms';
      setError(message);
      setDefinitions([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    if (!isTauri()) {
      setAtoms([]);
      setStatus('ready');
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      await initDb();
      const rows = await listAllAtoms();
      setAtoms(rows);
      setStatus('ready');
      bumpRefresh();
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Failed to load atoms';
      setError(message);
      setAtoms([]);
      setStatus('error');
    }
  }, [bumpRefresh]);

  const removeAtom = useCallback(
    async (id: string) => {
      if (!isTauri()) {
        return;
      }

      try {
        await initDb();
        const existing = await getAtomById(id);
        const groupLabel = existing?.groupLabel ?? null;

        await deleteAtom(id);

        if (groupLabel) {
          await clearSingletonGroupLabel(groupLabel);
        }

        setAtoms((current) => current.filter((atom) => atom.id !== id));
        setDefinitions((current) => current.filter((atom) => atom.id !== id));
        bumpRefresh();
      } catch (cause: unknown) {
        const message = cause instanceof Error ? cause.message : 'Failed to delete atom';
        setError(message);
        throw cause;
      }
    },
    [bumpRefresh],
  );

  const updateAtom = useCallback(
    async (id: string, patch: { type: AtomType; answer: string; sourceText?: string }) => {
      if (!isTauri()) {
        return;
      }

      try {
        await initDb();
        await updateAtomInStore(id, patch);

        const applyPatch = (atom: AtomRecord) => {
          if (atom.id !== id) {
            return atom;
          }

          const nextSource =
            patch.sourceText !== undefined ? patch.sourceText.trim() : atom.sourceText;

          return {
            ...atom,
            type: patch.type,
            answer: patch.answer.trim(),
            question: nextSource,
            sourceText: nextSource,
          };
        };

        setAtoms((current) => current.map(applyPatch));
        setDefinitions((current) => current.map(applyPatch));
        bumpRefresh();
      } catch (cause: unknown) {
        const message = cause instanceof Error ? cause.message : 'Failed to update atom';
        setError(message);
        throw cause;
      }
    },
    [bumpRefresh],
  );

  return {
    atoms,
    definitions,
    status,
    error,
    refreshKey,
    loadForFile,
    loadDefinitions,
    loadAll,
    removeAtom,
    updateAtom,
    refresh: bumpRefresh,
  };
}
