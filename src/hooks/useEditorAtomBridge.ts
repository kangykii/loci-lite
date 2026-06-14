import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AtomDecorationItem } from '../editor/context/AtomEditorContext';
import type {
  BookmarkRequestDetail,
  DefinitionShortcutDetail,
  SelectionDetail,
} from '../editor/context/EditorChromeContext';
import { atomRecordToDecoration } from '../lib/atomDecorations';
import { persistDefinitionShortcut } from '../lib/definitionShortcutSave';
import { dispatchBookmarkCreated } from '../lib/pluginLifecycle';
import { findSpanInMarkdown } from '../lib/atomSpans';
import type { AtomRecord } from '../lib/atomTypes';
import { useAtomCreation } from './useAtomCreation';
import { useAtoms } from './useAtoms';
import { useNotifications } from './useNotifications';

type RequestDeleteAtom = (id: string, sourceText: string) => void;

export function useEditorAtomBridge(
  fileId: string,
  markdown: string,
  onRequestDeleteAtom: RequestDeleteAtom,
) {
  const { notifyBookmark } = useNotifications();
  const [createdAtom, setCreatedAtom] = useState<AtomDecorationItem | null>(null);
  const [selection, setSelection] = useState<SelectionDetail>({
    hasSelection: false,
    selectedText: '',
  });
  const [shortcutError, setShortcutError] = useState<string | null>(null);
  const atoms = useAtoms();

  const handleAtomCreated = useCallback(
    (record: AtomRecord) => {
      if (record.type !== 'reminder') {
        setCreatedAtom(atomRecordToDecoration(record));
      }
      void atoms.loadForFile(fileId);

      if (record.type === 'definition') {
        void atoms.loadDefinitions();
      }
    },
    [atoms, fileId],
  );

  const atomCreation = useAtomCreation(handleAtomCreated);
  const { loadForFile, loadDefinitions } = atoms;

  useEffect(() => {
    void loadForFile(fileId);
    void loadDefinitions();
  }, [fileId, loadDefinitions, loadForFile]);

  const handleBookmarkRequest = useCallback(
    (detail: BookmarkRequestDetail) => {
      atomCreation.openPopup(detail.selectedText, detail.spanStart, detail.spanEnd, fileId);
    },
    [atomCreation, fileId],
  );

  const handleSelectionChange = useCallback((detail: SelectionDetail) => {
    setShortcutError(null);
    setSelection(detail);
  }, []);

  const handleDefinitionShortcut = useCallback(
    async (detail: DefinitionShortcutDetail) => {
      if (!fileId) {
        return;
      }

      const term = detail.term.trim();
      const definition = detail.definition.trim();
      if (!term || !definition) {
        return;
      }

      setShortcutError(null);

      try {
        const atom = await persistDefinitionShortcut(fileId, {
          ...detail,
          term,
          definition,
        });
        handleAtomCreated(atom);
        dispatchBookmarkCreated({ text: term, type: 'definition' });
        notifyBookmark();
      } catch (cause: unknown) {
        const message =
          cause instanceof Error ? cause.message : 'Failed to save definition shortcut';
        setShortcutError(message);
        throw cause;
      }
    },
    [fileId, handleAtomCreated, notifyBookmark],
  );

  const handleBarBookmark = useCallback(() => {
    if (!selection.hasSelection) {
      return;
    }

    const spans = findSpanInMarkdown(markdown, selection.selectedText);
    atomCreation.openPopup(
      selection.selectedText,
      spans?.spanStart ?? null,
      spans?.spanEnd ?? null,
      fileId,
    );
  }, [atomCreation, fileId, markdown, selection]);

  const atomEditor = useMemo(
    () => ({
      fileId,
      atoms: atoms.atoms.map(atomRecordToDecoration),
      definitionAtoms: atoms.definitions.map(atomRecordToDecoration),
      createdAtom,
      refreshSignal: atoms.refreshKey,
      clearCreatedAtom: () => setCreatedAtom(null),
      requestDeleteAtom: (id: string) => {
        const atom =
          atoms.atoms.find((entry) => entry.id === id) ??
          atoms.definitions.find((entry) => entry.id === id);
        onRequestDeleteAtom(id, atom?.sourceText ?? 'this bookmark');
      },
    }),
    [atoms, createdAtom, fileId, onRequestDeleteAtom],
  );

  const editorChrome = useMemo(
    () => ({
      isFocusMode: false,
      onBookmarkRequest: handleBookmarkRequest,
      onDefinitionShortcut: handleDefinitionShortcut,
      onSelectionChange: handleSelectionChange,
    }),
    [handleBookmarkRequest, handleDefinitionShortcut, handleSelectionChange],
  );

  return {
    atomEditor,
    editorChrome,
    selection,
    atomCreation,
    shortcutError,
    clearShortcutError: () => setShortcutError(null),
    handleBarBookmark,
    removeAtom: atoms.removeAtom,
    reloadAtoms: () => void atoms.loadForFile(fileId),
  };
}
