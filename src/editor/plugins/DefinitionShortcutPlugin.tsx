import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect } from 'react';
import { findSpanInMarkdown } from '../../lib/atomSpans';
import { markdownTransformers } from '../config/markdownTransformers';
import {
  useEditorChromeContext,
  type DefinitionShortcutDetail,
} from '../context/EditorChromeContext';
import { setDefinitionShortcutHandler } from '../lib/definitionShortcutBridge';
import { $revertDefinitionShortcut } from '../lib/definitionShortcutRevert';

export default function DefinitionShortcutPlugin() {
  const [editor] = useLexicalComposerContext();
  const { onDefinitionShortcut } = useEditorChromeContext();

  const handleShortcut = useCallback(
    (detail: DefinitionShortcutDetail) => {
      editor.getEditorState().read(() => {
        const exported = $convertToMarkdownString(markdownTransformers);
        const spans = findSpanInMarkdown(exported, detail.term);
        const payload: DefinitionShortcutDetail = {
          ...detail,
          spanStart: spans?.spanStart ?? null,
          spanEnd: spans?.spanEnd ?? null,
        };

        void (async () => {
          try {
            await onDefinitionShortcut(payload);
          } catch {
            editor.update(() => {
              $revertDefinitionShortcut(payload.nodeKey, payload.term);
            });
          }
        })();
      });
    },
    [editor, onDefinitionShortcut],
  );

  useEffect(() => {
    setDefinitionShortcutHandler(handleShortcut);
    return () => setDefinitionShortcutHandler(null);
  }, [handleShortcut]);

  return null;
}
