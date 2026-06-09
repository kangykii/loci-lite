import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { useAtomEditorContext } from '../context/AtomEditorContext';
import { $applyAtomDecorations } from '../lib/applyAtomDecorations';
import { NON_PERSISTENT_DECORATION_TAG } from '../lib/editorUpdateTags';

export default function AtomDecorationPlugin() {
  const [editor] = useLexicalComposerContext();
  const { fileId, atoms, createdAtom, refreshSignal, clearCreatedAtom } =
    useAtomEditorContext();

  useEffect(() => {
    if (!fileId) {
      return;
    }

    const targets = atoms.map((atom) => ({
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
  }, [atoms, editor, fileId, refreshSignal]);

  useEffect(() => {
    if (!createdAtom) {
      return;
    }

    editor.update(
      () => {
        $applyAtomDecorations([
          {
            id: createdAtom.id,
            type: createdAtom.type,
            content: createdAtom.content,
            sourceText: createdAtom.sourceText,
          },
        ]);
      },
      { discrete: true, tag: NON_PERSISTENT_DECORATION_TAG },
    );

    clearCreatedAtom();
  }, [clearCreatedAtom, createdAtom, editor]);

  return null;
}
