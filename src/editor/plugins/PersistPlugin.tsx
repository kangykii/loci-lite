import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { EditorState, LexicalEditor } from 'lexical';
import { useCallback, useEffect, useRef } from 'react';
import { markdownTransformers } from '../config/markdownTransformers';
import { NON_PERSISTENT_DECORATION_TAG } from '../lib/editorUpdateTags';

const DEBOUNCE_MS = 800;

type PersistPluginProps = {
  onSave: (markdown: string) => void | Promise<void>;
  onFlushReady?: (flush: (() => Promise<void>) | null) => void;
};

export default function PersistPlugin({ onSave, onFlushReady }: PersistPluginProps) {
  const [editor] = useLexicalComposerContext();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipInitialChangeRef = useRef(true);
  const onSaveRef = useRef(onSave);
  const hasPendingSaveRef = useRef(false);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Runs a still-pending debounced save immediately, using the editor's latest
  // committed state. Without this, switching documents (or closing the app)
  // within the 800ms debounce window silently discards the last edit — the
  // editor unmounts (`key={fileId}` in EditorView) and the pending timeout was
  // simply cleared, never fired.
  const flushPendingSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!hasPendingSaveRef.current) {
      return;
    }

    hasPendingSaveRef.current = false;
    const markdown = editor.getEditorState().read(() =>
      $convertToMarkdownString(markdownTransformers, undefined, true),
    );
    await onSaveRef.current(markdown);
  }, [editor]);

  useEffect(() => {
    onFlushReady?.(flushPendingSave);
    return () => onFlushReady?.(null);
  }, [flushPendingSave, onFlushReady]);

  useEffect(() => {
    return () => {
      void flushPendingSave().catch(() => undefined);
    };
  }, [flushPendingSave]);

  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor, tags: Set<string>) => {
      if (tags.has(NON_PERSISTENT_DECORATION_TAG)) {
        return;
      }

      if (skipInitialChangeRef.current) {
        skipInitialChangeRef.current = false;
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      hasPendingSaveRef.current = true;
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        hasPendingSaveRef.current = false;
        editorState.read(() => {
          const markdown = $convertToMarkdownString(markdownTransformers, undefined, true);
          void Promise.resolve(onSaveRef.current(markdown)).catch(() => undefined);
        });
      }, DEBOUNCE_MS);
    },
    [],
  );

  return <OnChangePlugin ignoreSelectionChange onChange={handleChange} />;
}
