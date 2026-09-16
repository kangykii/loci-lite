import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, type LexicalEditor } from 'lexical';
import { useEffect, useRef } from 'react';
import { useEditorChromeContext } from '../context/EditorChromeContext';
import { NON_PERSISTENT_DECORATION_TAG } from '../lib/editorUpdateTags';

function clearAllFocusAttributes(editor: LexicalEditor) {
  const rootElement = editor.getRootElement();

  if (!rootElement) {
    return;
  }

  rootElement.querySelectorAll('[data-focus="true"]').forEach((element) => {
    element.removeAttribute('data-focus');
  });
}

function syncFocusFromCaret(editor: LexicalEditor) {
  let activeKey: string | null = null;
  let hasRangeSelection = false;

  editor.getEditorState().read(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
      return;
    }

    hasRangeSelection = true;

    const topBlock = selection.anchor.getNode().getTopLevelElement();

    if (!topBlock) {
      return;
    }

    activeKey = topBlock.getKey();
  });

  clearAllFocusAttributes(editor);

  if (!hasRangeSelection || !activeKey) {
    return;
  }

  const activeElement = editor.getElementByKey(activeKey);

  if (activeElement) {
    activeElement.setAttribute('data-focus', 'true');
  }
}

export default function FocusModePlugin() {
  const [editor] = useLexicalComposerContext();
  const { isFocusMode } = useEditorChromeContext();
  const isFocusModeRef = useRef(isFocusMode);

  isFocusModeRef.current = isFocusMode;

  useEffect(() => {
    if (!isFocusMode) {
      clearAllFocusAttributes(editor);
      return;
    }

    syncFocusFromCaret(editor);
  }, [editor, isFocusMode]);

  useEffect(() => {
    // Background decoration passes (bookmark/definition scans elsewhere in the
    // document) commit their own editor.update() with no real caret movement.
    // Without this check, every one of those re-runs the clear+reapply of
    // data-focus, flickering the dimmed blocks while the user is just reading.
    return editor.registerUpdateListener(({ tags }) => {
      if (!isFocusModeRef.current || tags.has(NON_PERSISTENT_DECORATION_TAG)) {
        return;
      }

      syncFocusFromCaret(editor);
    });
  }, [editor]);

  return null;
}
