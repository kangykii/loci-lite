import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  type EditorState,
  type LexicalEditor,
} from 'lexical';
import { useEffect, useRef } from 'react';
import { NON_PERSISTENT_DECORATION_TAG } from '../lib/editorUpdateTags';

const LOCK_RATIO = 0.4;

type AnchorPosition = {
  key: string;
  offset: number;
};

type ScrollTarget =
  | { kind: 'window' }
  | { kind: 'element'; el: HTMLElement };

function resolveScrollTarget(editorEl: HTMLElement): ScrollTarget {
  const dataView = editorEl.closest<HTMLElement>('[data-editor-scroll]');

  if (dataView) {
    const overflowY = getComputedStyle(dataView).overflowY;

    if (overflowY !== 'visible') {
      return { kind: 'element', el: dataView as HTMLElement };
    }
  }

  return { kind: 'window' };
}

function scrollInstant(delta: number, target: ScrollTarget): void {
  if (Math.abs(delta) < 1) {
    return;
  }

  if (target.kind === 'window') {
    window.scrollBy({ top: delta, left: 0, behavior: 'instant' });
  } else {
    target.el.scrollTop += delta;
  }
}

// A range collapsed inside a *brand new, still-empty* paragraph (the moment
// right after pressing Enter) is a well-known contentEditable/Selection API
// flaky spot: getBoundingClientRect()/getClientRects() can report a zeroed-out
// rect because there's no text run yet for the browser to anchor a line box
// to. Treat that shape as untrustworthy rather than scrolling based on it.
function isUsableRect(rect: DOMRect | null | undefined): rect is DOMRect {
  if (!rect) {
    return false;
  }

  return !(rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0);
}

function getNativeCaretRect(): DOMRect | null {
  const nativeSelection = window.getSelection();

  if (!nativeSelection || nativeSelection.rangeCount === 0) {
    return null;
  }

  const range = nativeSelection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.height > 0 && isUsableRect(rect)) {
    return rect;
  }

  const clientRects = range.getClientRects();
  const fromClientRects = clientRects[0];

  if (isUsableRect(fromClientRects)) {
    return fromClientRects;
  }

  return isUsableRect(rect) ? rect : null;
}

// Falls back to the DOM element Lexical says the caret is in (reliable even
// with no text yet, e.g. a freshly created empty paragraph) when the native
// Selection API can't give us a trustworthy rect.
function getCaretRect(editor: LexicalEditor, anchor: AnchorPosition): DOMRect | null {
  const native = getNativeCaretRect();

  if (native) {
    return native;
  }

  const element = editor.getElementByKey(anchor.key);
  const elementRect = element?.getBoundingClientRect();

  return isUsableRect(elementRect) ? elementRect : null;
}

function repositionCaret(editor: LexicalEditor, anchor: AnchorPosition, scrollTarget: ScrollTarget): void {
  const rect = getCaretRect(editor, anchor);

  if (!rect) {
    // No trustworthy measurement this frame — skip rather than scroll blind.
    // The next keystroke re-triggers this and self-corrects.
    return;
  }

  const targetY = window.innerHeight * LOCK_RATIO;
  const delta = rect.top - targetY;
  scrollInstant(delta, scrollTarget);
}

function readAnchorFromState(editorState: EditorState): AnchorPosition | null {
  let anchor: AnchorPosition | null = null;

  editorState.read(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
      return;
    }

    anchor = {
      key: selection.anchor.key,
      offset: selection.anchor.offset,
    };
  });

  return anchor;
}

function readAnchor(editor: LexicalEditor): AnchorPosition | null {
  return readAnchorFromState(editor.getEditorState());
}

type TypewriterScrollPluginProps = {
  active: boolean;
};

export default function TypewriterScrollPlugin({ active }: TypewriterScrollPluginProps) {
  const [editor] = useLexicalComposerContext();
  const activeRef = useRef(active);
  const lastAnchorRef = useRef<AnchorPosition | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const scrollTargetRef = useRef<ScrollTarget>({ kind: 'window' });

  activeRef.current = active;

  useEffect(() => {
    if (!active) {
      lastAnchorRef.current = null;

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      return;
    }

    const root = editor.getRootElement();

    if (root) {
      scrollTargetRef.current = resolveScrollTarget(root);
    }

    lastAnchorRef.current = null;
  }, [active, editor]);

  useEffect(() => {
    // Background decoration passes (e.g. an atom/definition scan elsewhere in
    // the document) can split or replace text nodes and force the current
    // selection to re-resolve to a new node key even though the user didn't
    // move their caret — without this check that reads as caret movement and
    // yanks the scroll position out from under whatever the user is doing.
    return editor.registerUpdateListener(({ editorState, tags }) => {
      if (!activeRef.current || tags.has(NON_PERSISTENT_DECORATION_TAG)) {
        return;
      }

      const anchor = readAnchorFromState(editorState);

      if (!anchor) {
        return;
      }

      const last = lastAnchorRef.current;

      if (last && last.key === anchor.key && last.offset === anchor.offset) {
        return;
      }

      lastAnchorRef.current = anchor;

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;

        const root = editor.getRootElement();

        if (!root || !activeRef.current) {
          return;
        }

        scrollTargetRef.current = resolveScrollTarget(root);
        repositionCaret(editor, anchor, scrollTargetRef.current);
      });
    });
  }, [editor]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const root = editor.getRootElement();

    if (!root) {
      return;
    }

    scrollTargetRef.current = resolveScrollTarget(root);
    const anchor = readAnchor(editor);

    if (anchor) {
      lastAnchorRef.current = anchor;
      requestAnimationFrame(() => {
        repositionCaret(editor, anchor, scrollTargetRef.current);
      });
    }
  }, [active, editor]);

  return null;
}
