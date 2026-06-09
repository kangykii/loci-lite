import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useCallback, useEffect, useRef } from 'react';
import type { EditorState, LexicalEditor } from 'lexical';
import { useAtomEditorContext } from '../context/AtomEditorContext';
import { $applyAtomDecorations } from '../lib/applyAtomDecorations';
import { NON_PERSISTENT_DECORATION_TAG } from '../lib/editorUpdateTags';

const SCAN_DELAY_MS = 1200;

export default function DefinitionScanPlugin() {
  const [editor] = useLexicalComposerContext();
  const { fileId, definitionAtoms } = useAtomEditorContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runScan = useCallback(() => {
    if (!fileId || definitionAtoms.length === 0) {
      return;
    }

    const targets = definitionAtoms.map((atom) => ({
      id: atom.id,
      type: atom.type,
      content: atom.content,
      sourceText: atom.sourceText,
    }));

    editor.update(
      () => {
        $applyAtomDecorations(targets);
      },
      { discrete: true, tag: NON_PERSISTENT_DECORATION_TAG },
    );
  }, [definitionAtoms, editor, fileId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (_editorState: EditorState, _editor: LexicalEditor, tags: Set<string>) => {
      if (tags.has(NON_PERSISTENT_DECORATION_TAG)) {
        return;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        runScan();
      }, SCAN_DELAY_MS);
    },
    [runScan],
  );

  if (!fileId) {
    return null;
  }

  return <OnChangePlugin ignoreSelectionChange onChange={handleChange} />;
}
