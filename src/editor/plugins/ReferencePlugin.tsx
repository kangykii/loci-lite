import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createRangeSelection,
  $getNodeByKey,
  $getRoot,
  $setSelection,
} from 'lexical';
import { useEffect } from 'react';
import { NON_PERSISTENT_DECORATION_TAG } from '../lib/editorUpdateTags';
import {
  setReferenceInsertHandler,
  type ReferenceSelectionPoint,
} from '../lib/referenceBridge';
import { $createReferenceNode, $isReferenceNode } from '../nodes/ReferenceNode';

function setPoint(
  target: ReturnType<typeof $createRangeSelection>['anchor'],
  source: ReferenceSelectionPoint,
): void {
  target.set(source.key, source.offset, source.type);
}

function hasSelectionTarget(point: ReferenceSelectionPoint): boolean {
  return $getNodeByKey(point.key) !== null;
}

function numberReferences(): void {
  let number = 1;

  for (const node of $getRoot().getAllTextNodes()) {
    if ($isReferenceNode(node)) {
      if (node.__number !== number) {
        node.setNumber(number);
      }
      number += 1;
    }
  }
}

export default function ReferencePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    setReferenceInsertHandler(({ citation, selection }) => {
      if (!citation.trim()) {
        return false;
      }

      let inserted = false;
      editor.update(() => {
        if (!hasSelectionTarget(selection.anchor) || !hasSelectionTarget(selection.focus)) {
          return;
        }

        const range = $createRangeSelection();
        setPoint(range.anchor, selection.anchor);
        setPoint(range.focus, selection.focus);
        const end = range.isBackward() ? selection.anchor : selection.focus;

        const collapsed = $createRangeSelection();
        setPoint(collapsed.anchor, end);
        setPoint(collapsed.focus, end);
        $setSelection(collapsed);
        collapsed.insertNodes([$createReferenceNode(citation)]);
        numberReferences();
        inserted = true;
      });

      return inserted;
    });

    return () => setReferenceInsertHandler(null);
  }, [editor]);

  useEffect(() => {
    editor.update(
      () => {
        numberReferences();
      },
      { discrete: true, tag: NON_PERSISTENT_DECORATION_TAG },
    );

    return editor.registerUpdateListener(({ tags }) => {
      if (tags.has(NON_PERSISTENT_DECORATION_TAG)) {
        return;
      }

      editor.update(
        () => {
          numberReferences();
        },
        { discrete: true, tag: NON_PERSISTENT_DECORATION_TAG },
      );
    });
  }, [editor]);

  return null;
}
