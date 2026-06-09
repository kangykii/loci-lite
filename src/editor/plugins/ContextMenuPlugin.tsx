import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Bookmark, Check } from 'lucide-react';
import { $getSelection, $isRangeSelection } from 'lexical';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import ContextMenu from '../../components/ui/ContextMenu';
import type { ContextMenuItem } from '../../components/ui/ContextMenu';
import { findSpanInMarkdown } from '../../lib/atomSpans';
import { markdownTransformers } from '../config/markdownTransformers';
import {
  type AuthorshipAnnotationItem,
  useAuthorshipEditorContext,
} from '../context/AuthorshipEditorContext';
import { useEditorChromeContext } from '../context/EditorChromeContext';

type MenuState = {
  x: number;
  y: number;
  selectedText: string;
  annotationId: string | null;
  markSpanStart: number | null;
  markSpanEnd: number | null;
};

type MarkdownRange = {
  spanStart: number;
  spanEnd: number;
};

type DocumentWithCaret = Document & {
  caretPositionFromPoint?: (x: number, y: number) => {
    offsetNode: Node;
    offset: number;
  } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

function nodeTextLength(node: Node): number {
  return node.textContent?.length ?? 0;
}

function domPointToMarkdownOffset(root: HTMLElement, target: Node, offset: number): number | null {
  let currentOffset = 0;
  let found: number | null = null;
  let previousBlockHadText = false;

  function walk(node: Node): void {
    if (found !== null) {
      return;
    }

    if (node === target) {
      found = currentOffset + offset;
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      currentOffset += nodeTextLength(node);
      return;
    }

    for (const child of Array.from(node.childNodes)) {
      walk(child);
    }
  }

  for (const child of Array.from(root.childNodes)) {
    if (!nodeTextLength(child)) {
      continue;
    }

    if (previousBlockHadText) {
      currentOffset += 2;
    }

    walk(child);
    previousBlockHadText = true;
  }

  return found;
}

function selectedMarkdownRange(root: HTMLElement): MarkdownRange | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.anchorNode || !selection.focusNode) {
    return null;
  }

  if (!root.contains(selection.anchorNode) || !root.contains(selection.focusNode)) {
    return null;
  }

  const anchor = domPointToMarkdownOffset(root, selection.anchorNode, selection.anchorOffset);
  const focus = domPointToMarkdownOffset(root, selection.focusNode, selection.focusOffset);
  if (anchor === null || focus === null || anchor === focus) {
    return null;
  }

  return {
    spanStart: Math.min(anchor, focus),
    spanEnd: Math.max(anchor, focus),
  };
}

function clickedMarkdownOffset(root: HTMLElement, event: MouseEvent): number | null {
  const doc = document as DocumentWithCaret;
  const position = doc.caretPositionFromPoint?.(event.clientX, event.clientY);
  if (position) {
    return domPointToMarkdownOffset(root, position.offsetNode, position.offset);
  }

  const range = doc.caretRangeFromPoint?.(event.clientX, event.clientY);
  if (!range) {
    return null;
  }

  return domPointToMarkdownOffset(root, range.startContainer, range.startOffset);
}

function wordRangeAtOffset(markdown: string, offset: number): MarkdownRange {
  let start = Math.max(0, Math.min(offset, markdown.length));
  let end = start;

  while (start > 0 && /\S/.test(markdown[start - 1])) {
    start -= 1;
  }

  while (end < markdown.length && /\S/.test(markdown[end])) {
    end += 1;
  }

  return start === end
    ? { spanStart: start, spanEnd: Math.min(markdown.length, start + 1) }
    : { spanStart: start, spanEnd: end };
}

function findIntersectingAnnotation(
  annotations: AuthorshipAnnotationItem[],
  range: MarkdownRange,
): AuthorshipAnnotationItem | null {
  const matches = annotations.filter(
    (annotation) =>
      annotation.spanStart < range.spanEnd && range.spanStart < annotation.spanEnd,
  );

  return matches.sort(
    (left, right) =>
      left.spanEnd - left.spanStart - (right.spanEnd - right.spanStart),
  )[0] ?? null;
}

export default function ContextMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const { onBookmarkRequest } = useEditorChromeContext();
  const { annotations, onMarkAsMine } = useAuthorshipEditorContext();
  const [menu, setMenu] = useState<MenuState | null>(null);

  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) {
      return;
    }

    const handleContextMenu = (event: MouseEvent) => {
      let selectedText = '';
      let markdown = '';

      editor.getEditorState().read(() => {
        markdown = $convertToMarkdownString(markdownTransformers);
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          selectedText = selection.getTextContent().trim();
        }
      });

      const selectionRange = selectedMarkdownRange(root);
      const clickedOffset = selectionRange ? null : clickedMarkdownOffset(root, event);
      const candidateRange =
        selectionRange ??
        (clickedOffset === null ? null : wordRangeAtOffset(markdown, clickedOffset));
      const annotation =
        candidateRange === null
          ? null
          : findIntersectingAnnotation(annotations, candidateRange);
      const markSpanStart =
        annotation && candidateRange
          ? Math.max(annotation.spanStart, candidateRange.spanStart)
          : null;
      const markSpanEnd =
        annotation && candidateRange
          ? Math.min(annotation.spanEnd, candidateRange.spanEnd)
          : null;

      if (!annotation && !selectedText) {
        setMenu(null);
        return;
      }

      event.preventDefault();
      setMenu({
        x: event.clientX,
        y: event.clientY,
        selectedText,
        annotationId: annotation?.id ?? null,
        markSpanStart,
        markSpanEnd,
      });
    };

    root.addEventListener('contextmenu', handleContextMenu);
    return () => root.removeEventListener('contextmenu', handleContextMenu);
  }, [annotations, editor]);

  const handleBookmark = useCallback(() => {
    if (!menu?.selectedText) {
      return;
    }

    editor.getEditorState().read(() => {
      const markdown = $convertToMarkdownString(markdownTransformers);
      const spans = findSpanInMarkdown(markdown, menu.selectedText);

      onBookmarkRequest({
        selectedText: menu.selectedText,
        spanStart: spans?.spanStart ?? null,
        spanEnd: spans?.spanEnd ?? null,
      });
    });

    setMenu(null);
  }, [editor, menu, onBookmarkRequest]);

  const handleMarkAsMine = useCallback(() => {
    if (
      !menu?.annotationId ||
      menu.markSpanStart === null ||
      menu.markSpanEnd === null
    ) {
      return;
    }

    const annotationId = menu.annotationId;
    const spanStart = menu.markSpanStart;
    const spanEnd = menu.markSpanEnd;
    setMenu(null);

    void Promise.resolve(
      onMarkAsMine({
        annotationId,
        spanStart,
        spanEnd,
      }),
    ).catch(() => undefined);
  }, [menu, onMarkAsMine]);

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menu) {
      return [];
    }

    const items: ContextMenuItem[] = [];

    if (menu.annotationId) {
      items.push({
        label: 'Mark as mine',
        icon: <Check size={16} strokeWidth={1.5} />,
        onClick: handleMarkAsMine,
      });
    }

    if (menu.selectedText) {
      items.push({
        label: 'Bookmark',
        icon: <Bookmark size={16} strokeWidth={1.5} />,
        onClick: handleBookmark,
      });
    }

    return items;
  }, [handleBookmark, handleMarkAsMine, menu]);

  if (!menu) {
    return null;
  }

  return createPortal(
    <ContextMenu
      items={menuItems}
      onClose={() => setMenu(null)}
      x={menu.x}
      y={menu.y}
    />,
    document.body,
  );
}
