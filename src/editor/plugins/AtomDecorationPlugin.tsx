import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { useAtomEditorContext } from '../context/AtomEditorContext';
import { $applyAtomDecorations, $removeAtomDecorations } from '../lib/applyAtomDecorations';
import { NON_PERSISTENT_DECORATION_TAG } from '../lib/editorUpdateTags';

export default function AtomDecorationPlugin() {
  const [editor] = useLexicalComposerContext();
  const { fileId, atoms, createdAtom, refreshSignal, clearCreatedAtom } =
    useAtomEditorContext();
  // This is the authoritative per-file atom list, so an id that drops out of it
  // (deleted, or type changed away from what this list includes) is safe to
  // unwrap back to plain text rather than leaving a ghost decoration behind.
  const previousIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!fileId) {
      return;
    }

    const targets = atoms.map((atom) => ({
      id: atom.id,
      type: atom.type,
      content: atom.content,
      sourceText: atom.sourceText,
      spanStart: atom.spanStart,
      spanEnd: atom.spanEnd,
    }));

    const currentIds = new Set(targets.map((target) => target.id));
    const removedIds = new Set(
      [...previousIdsRef.current].filter((id) => !currentIds.has(id)),
    );
    previousIdsRef.current = currentIds;

    editor.update(
      () => {
        if (removedIds.size > 0) {
          $removeAtomDecorations(removedIds);
        }
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
            spanStart: createdAtom.spanStart,
            spanEnd: createdAtom.spanEnd,
          },
        ]);
      },
      { discrete: true, tag: NON_PERSISTENT_DECORATION_TAG },
    );

    clearCreatedAtom();
  }, [clearCreatedAtom, createdAtom, editor]);

  return null;
}
