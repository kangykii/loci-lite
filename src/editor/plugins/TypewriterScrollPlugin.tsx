import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  type EditorState,
  type LexicalEditor,
} from 'lexical';
import { useEffect, useRef } from 'react';

const LOCK_RATIO = 0.4;

type AnchorPosition = {
  key: string;
  offset: number;
};

type ScrollTarget =
  | { kind: 'window' }
  | { kind: 'element'; el: HTMLElement };

function resolveScrollTarget(editorEl: HTMLElement): ScrollTarget {
  const dataView = editorEl.closest('[data-view]');

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

function getCaretRect(): DOMRect | null {
  const nativeSelection = window.getSelection();

  if (!nativeSelection || nativeSelection.rangeCount === 0) {
    return null;
  }

  const range = nativeSelection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.height > 0) {
    return rect;
  }

  const clientRects = range.getClientRects();

  if (clientRects.length > 0) {
    return clientRects[0] ?? null;
  }

  return rect;
}

function repositionCaret(scrollTarget: ScrollTarget): void {
  const rect = getCaretRect();

  if (!rect) {
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
    return editor.registerUpdateListener(({ editorState }) => {
      if (!activeRef.current) {
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
        repositionCaret(scrollTargetRef.current);
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
        repositionCaret(scrollTargetRef.current);
      });
    }
  }, [active, editor]);

  return null;
}
