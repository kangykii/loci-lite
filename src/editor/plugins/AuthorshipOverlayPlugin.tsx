import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect } from 'react';
import { useAuthorshipEditorContext } from '../context/AuthorshipEditorContext';
import { mapVisibleTextSpanToTextMatches } from '../lib/authorshipIndex';

const AUTHORSHIP_HIGHLIGHT_COUNT = 6;
const AUTHORSHIP_HIGHLIGHT_NAMES = Array.from(
  { length: AUTHORSHIP_HIGHLIGHT_COUNT },
  (_, index) => `loci-authorship-${index + 1}`,
);
const LEGACY_HIGHLIGHT_NAMES = ['loci-authorship-paste'];

type HighlightRegistry = {
  set: (name: string, highlight: unknown) => void;
  delete: (name: string) => void;
};

type HighlightWindow = Window & {
  Highlight?: new (...ranges: Range[]) => unknown;
};

function getHighlightRegistry(): HighlightRegistry | null {
  const css = window.CSS as { highlights?: HighlightRegistry };
  return css.highlights ?? null;
}

function getHighlightConstructor(): HighlightWindow['Highlight'] {
  return (window as HighlightWindow).Highlight;
}

function clearAuthorshipHighlights(): void {
  const registry = getHighlightRegistry();
  if (!registry) {
    return;
  }

  [...AUTHORSHIP_HIGHLIGHT_NAMES, ...LEGACY_HIGHLIGHT_NAMES].forEach((name) => {
    registry.delete(name);
  });
}

function findTextDescendant(root: Node): Text | null {
  if (root.nodeType === Node.TEXT_NODE) {
    return root as Text;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
}

function tokenRangesForTextNode(textNode: Text, start: number, end: number): Range[] {
  const value = textNode.textContent ?? '';
  const safeStart = Math.max(0, Math.min(start, value.length));
  const safeEnd = Math.max(safeStart, Math.min(end, value.length));
  const source = value.slice(safeStart, safeEnd);
  const pattern = /\S+/g;
  const ranges: Range[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    const range = document.createRange();
    range.setStart(textNode, safeStart + match.index);
    range.setEnd(textNode, safeStart + match.index + match[0].length);
    ranges.push(range);
  }

  return ranges;
}

function applyAuthorshipHighlights(ranges: Range[]): void {
  const registry = getHighlightRegistry();
  const HighlightConstructor = getHighlightConstructor();
  clearAuthorshipHighlights();

  if (!registry || !HighlightConstructor || ranges.length === 0) {
    return;
  }

  const buckets = AUTHORSHIP_HIGHLIGHT_NAMES.map((): Range[] => []);
  ranges.forEach((range, index) => {
    buckets[index % AUTHORSHIP_HIGHLIGHT_COUNT].push(range);
  });

  buckets.forEach((bucket, index) => {
    if (bucket.length > 0) {
      registry.set(AUTHORSHIP_HIGHLIGHT_NAMES[index], new HighlightConstructor(...bucket));
    }
  });
}

export default function AuthorshipOverlayPlugin() {
  const [editor] = useLexicalComposerContext();
  const { annotations, authorshipVisible, fileId } = useAuthorshipEditorContext();

  const repaint = useCallback(() => {
    const root = editor.getRootElement();
    if (!root || !fileId || !authorshipVisible || annotations.length === 0) {
      clearAuthorshipHighlights();
      return;
    }

    const nextRanges: Range[] = [];

    editor.getEditorState().read(() => {
      annotations.forEach((annotation) => {
        const matches = mapVisibleTextSpanToTextMatches(
          annotation.spanStart,
          annotation.spanEnd,
        );

        matches.forEach((match) => {
          const element = editor.getElementByKey(match.node.getKey());
          if (!element) {
            return;
          }

          const textNode = findTextDescendant(element);
          if (textNode) {
            nextRanges.push(...tokenRangesForTextNode(textNode, match.start, match.end));
          }
        });
      });
    });

    applyAuthorshipHighlights(nextRanges);
  }, [annotations, authorshipVisible, editor, fileId]);

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
      clearAuthorshipHighlights();
    };
  }, [editor, repaint]);

  return null;
}
