import { $convertToMarkdownString } from '@lexical/markdown';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { EditorState, LexicalEditor } from 'lexical';
import { useCallback, useEffect, useRef } from 'react';
import { markdownTransformers } from '../config/markdownTransformers';
import { NON_PERSISTENT_DECORATION_TAG } from '../lib/editorUpdateTags';

const DEBOUNCE_MS = 800;

type PersistPluginProps = {
  onSave: (markdown: string) => void | Promise<void>;
};

export default function PersistPlugin({ onSave }: PersistPluginProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipInitialChangeRef = useRef(true);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((editorState: EditorState, _editor: LexicalEditor, tags: Set<string>) => {
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

    timeoutRef.current = setTimeout(() => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(markdownTransformers);
        void onSaveRef.current(markdown);
      });
    }, DEBOUNCE_MS);
  }, []);

  return <OnChangePlugin ignoreSelectionChange onChange={handleChange} />;
}
