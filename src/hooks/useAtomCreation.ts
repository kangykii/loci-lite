import { useCallback, useState } from 'react';
import type { AtomSavePayload } from '../components/atoms/AtomPopup';
import { buildAtomRecord, saveAtomRecord } from '../lib/atomRecord';
import { dispatchBookmarkCreated } from '../lib/pluginLifecycle';
import type { AtomRecord } from '../lib/atomTypes';
import { useNotifications } from './useNotifications';

type PopupState = {
  selectedText: string;
  spanStart: number | null;
  spanEnd: number | null;
  fileId: string;
};

export function useAtomCreation(onCreated?: (atom: AtomRecord) => void) {
  const { notifyBookmark, notifyError } = useNotifications();
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = popup !== null;
  const selectedText = popup?.selectedText ?? '';

  const openPopup = useCallback(
    (
      text: string,
      spanStart: number | null,
      spanEnd: number | null,
      fileId: string,
    ) => {
      const trimmed = text.trim();
      if (!trimmed || !fileId) {
        return;
      }

      setPopup({
        selectedText: trimmed,
        spanStart,
        spanEnd,
        fileId,
      });
      setError(null);
    },
    [],
  );

  const closePopup = useCallback(() => {
    setPopup(null);
    setError(null);
  }, []);

  const saveAtom = useCallback(
    async (payload: AtomSavePayload) => {
      if (!popup) {
        return;
      }

      const answer = payload.content.trim();
      const sourceText = payload.sourceText.trim();
      if (!answer || !sourceText) {
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        const atom = buildAtomRecord({
          fileId: popup.fileId,
          type: payload.type,
          sourceText,
          answer,
          spanStart: popup.spanStart,
          spanEnd: popup.spanEnd,
        });

        await saveAtomRecord(atom);
        onCreated?.(atom);
        dispatchBookmarkCreated({ text: sourceText, type: payload.type });
        notifyBookmark();
        setPopup(null);
      } catch (cause: unknown) {
        const message = cause instanceof Error ? cause.message : 'Failed to save atom';
        setError(message);
        notifyError(message);
        throw cause;
      } finally {
        setIsSaving(false);
      }
    },
    [notifyBookmark, notifyError, onCreated, popup],
  );

  return {
    isOpen,
    selectedText,
    isSaving,
    error,
    openPopup,
    saveAtom,
    closePopup,
  };
}
