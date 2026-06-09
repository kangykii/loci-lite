import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthorshipEditorContext } from '../context/AuthorshipEditorContext';
import { mapMarkdownSpanToTextMatches } from '../lib/authorshipIndex';

const PASTE_HIGHLIGHT_NAME = 'loci-authorship-paste';

type HighlightRegistry = {
  set: (name: string, highlight: unknown) => void;
  delete: (name: string) => void;
};

type HighlightWindow = Window & {
  Highlight?: new (...ranges: Range[]) => unknown;
};

type OverlayRect = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

function getHighlightRegistry(): HighlightRegistry | null {
  const css = window.CSS as { highlights?: HighlightRegistry };
  return css.highlights ?? null;
}

function supportsCustomHighlight(): boolean {
  return Boolean(getHighlightRegistry() && (window as HighlightWindow).Highlight);
}

function findTextDescendant(root: Node): Text | null {
  if (root.nodeType === Node.TEXT_NODE) {
    return root as Text;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
}

function createDomRange(element: HTMLElement, start: number, end: number): Range | null {
  const textNode = findTextDescendant(element);
  if (!textNode) {
    return null;
  }

  const textLength = textNode.textContent?.length ?? 0;
  const range = document.createRange();
  range.setStart(textNode, Math.max(0, Math.min(start, textLength)));
  range.setEnd(textNode, Math.max(0, Math.min(end, textLength)));
  return range;
}

function clearHighlight(): void {
  getHighlightRegistry()?.delete(PASTE_HIGHLIGHT_NAME);
}

export default function AuthorshipOverlayPlugin() {
  const [editor] = useLexicalComposerContext();
  const { annotations, authorshipVisible, fileId } = useAuthorshipEditorContext();
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
  const [rects, setRects] = useState<OverlayRect[]>([]);

  const repaint = useCallback(() => {
    const root = editor.getRootElement();
    if (!root || !fileId || !authorshipVisible || annotations.length === 0) {
      clearHighlight();
      setRects([]);
      return;
    }

    const ranges: Range[] = [];

    editor.getEditorState().read(() => {
      for (const annotation of annotations) {
        if (annotation.source !== 'paste') {
          continue;
        }

        const matches = mapMarkdownSpanToTextMatches(
          annotation.spanStart,
          annotation.spanEnd,
        );

        for (const match of matches) {
          const element = editor.getElementByKey(match.node.getKey());
          if (!element) {
            continue;
          }

          const range = createDomRange(element, match.start, match.end);
          if (range) {
            ranges.push(range);
          }
        }
      }
    });

    if (supportsCustomHighlight()) {
      const HighlightConstructor = (window as HighlightWindow).Highlight;
      if (HighlightConstructor) {
        getHighlightRegistry()?.set(PASTE_HIGHLIGHT_NAME, new HighlightConstructor(...ranges));
      }
      setRects([]);
      return;
    }

    clearHighlight();

    const rootBox = root.getBoundingClientRect();
    const nextRects = ranges.flatMap((range, rangeIndex) =>
      Array.from(range.getClientRects()).map((rect, rectIndex) => ({
        id: `${rangeIndex}-${rectIndex}`,
        left: rect.left - rootBox.left + root.scrollLeft,
        top: rect.top - rootBox.top + root.scrollTop,
        width: rect.width,
        height: rect.height,
      })),
    );
    setRects(nextRects);
  }, [annotations, authorshipVisible, editor, fileId]);

  useEffect(() => {
    const root = editor.getRootElement();
    setOverlayRoot(root?.parentElement ?? null);
  }, [editor]);

  useEffect(() => {
    repaint();
    const unregister = editor.registerUpdateListener(() => {
      repaint();
    });

    window.addEventListener('resize', repaint);
    window.addEventListener('scroll', repaint, true);

    return () => {
      unregister();
      window.removeEventListener('resize', repaint);
      window.removeEventListener('scroll', repaint, true);
      clearHighlight();
    };
  }, [editor, repaint]);

  if (!overlayRoot || supportsCustomHighlight() || rects.length === 0) {
    return null;
  }

  return createPortal(
    <div className="authorship-overlay-layer" aria-hidden="true">
      {rects.map((rect) => (
        <span
          className="authorship-overlay-range"
          key={rect.id}
          style={{
            height: rect.height,
            left: rect.left,
            top: rect.top,
            width: rect.width,
          }}
        />
      ))}
    </div>,
    overlayRoot,
  );
}
