import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $getRoot,
  $isParagraphNode,
  PASTE_TAG,
  type EditorState,
  type LexicalNode,
  type NodeKey,
} from 'lexical';
import { useEffect, useRef } from 'react';

const CLEANUP_TAG = 'loci-paste-spacing-cleanup';

type TopLevelEntry = {
  key: NodeKey;
  isEmptyParagraph: boolean;
  isNewEmptyParagraph: boolean;
};

function isEmptyTopLevelParagraph(node: LexicalNode): boolean {
  return $isParagraphNode(node) && node.getTextContent().trim() === '';
}

function readEmptyParagraphKeys(editorState: EditorState): Set<NodeKey> {
  const keys = new Set<NodeKey>();
  editorState.read(() => {
    for (const child of $getRoot().getChildren()) {
      if (isEmptyTopLevelParagraph(child)) {
        keys.add(child.getKey());
      }
    }
  });
  return keys;
}

function readTopLevelEntries(
  editorState: EditorState,
  previousEmptyKeys: Set<NodeKey>,
): TopLevelEntry[] {
  const entries: TopLevelEntry[] = [];
  editorState.read(() => {
    for (const child of $getRoot().getChildren()) {
      const isEmptyParagraph = isEmptyTopLevelParagraph(child);
      const key = child.getKey();
      entries.push({
        key,
        isEmptyParagraph,
        isNewEmptyParagraph: isEmptyParagraph && !previousEmptyKeys.has(key),
      });
    }
  });
  return entries;
}

function findPastedEmptyParagraphsToRemove(entries: TopLevelEntry[]): NodeKey[] {
  const keysToRemove: NodeKey[] = [];

  for (let index = 0; index < entries.length; ) {
    const entry = entries[index];
    if (!entry.isEmptyParagraph) {
      index += 1;
      continue;
    }

    const run: TopLevelEntry[] = [];
    while (index < entries.length && entries[index].isEmptyParagraph) {
      run.push(entries[index]);
      index += 1;
    }

    const hasExistingSpacer = run.some((item) => !item.isNewEmptyParagraph);
    let keptNewSpacer = false;
    for (const item of run) {
      if (!item.isNewEmptyParagraph) {
        continue;
      }

      if (hasExistingSpacer || keptNewSpacer) {
        keysToRemove.push(item.key);
      } else {
        keptNewSpacer = true;
      }
    }
  }

  return keysToRemove;
}

export default function PasteSpacingPlugin() {
  const [editor] = useLexicalComposerContext();
  const isCleaningRef = useRef(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, prevEditorState, tags }) => {
      if (!tags.has(PASTE_TAG) || tags.has(CLEANUP_TAG) || isCleaningRef.current) {
        return;
      }

      const previousEmptyKeys = readEmptyParagraphKeys(prevEditorState);
      const entries = readTopLevelEntries(editorState, previousEmptyKeys);
      const keysToRemove = findPastedEmptyParagraphsToRemove(entries);

      if (keysToRemove.length === 0) {
        return;
      }

      try {
        isCleaningRef.current = true;
        editor.update(
          () => {
            for (const key of keysToRemove) {
              const node = $getNodeByKey(key);
              if (node && isEmptyTopLevelParagraph(node)) {
                node.remove();
              }
            }
          },
          {
            discrete: true,
            tag: CLEANUP_TAG,
          },
        );
      } finally {
        isCleaningRef.current = false;
      }
    });
  }, [editor]);

  return null;
}
