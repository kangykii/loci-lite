export type MarkdownRange = {
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
    if (found !== null) return;
    if (node === target) {
      found = currentOffset + offset;
      return;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      currentOffset += nodeTextLength(node);
      return;
    }
    for (const child of Array.from(node.childNodes)) walk(child);
  }

  for (const child of Array.from(root.childNodes)) {
    if (!nodeTextLength(child)) continue;
    if (previousBlockHadText) currentOffset += 2;
    walk(child);
    previousBlockHadText = true;
  }

  return found;
}

export function selectedMarkdownRange(root: HTMLElement): MarkdownRange | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.anchorNode || !selection.focusNode) {
    return null;
  }
  if (!root.contains(selection.anchorNode) || !root.contains(selection.focusNode)) return null;

  const anchor = domPointToMarkdownOffset(root, selection.anchorNode, selection.anchorOffset);
  const focus = domPointToMarkdownOffset(root, selection.focusNode, selection.focusOffset);
  if (anchor === null || focus === null || anchor === focus) return null;
  return { spanStart: Math.min(anchor, focus), spanEnd: Math.max(anchor, focus) };
}

export function clickedMarkdownOffset(root: HTMLElement, event: MouseEvent): number | null {
  const doc = document as DocumentWithCaret;
  const position = doc.caretPositionFromPoint?.(event.clientX, event.clientY);
  if (position) {
    return domPointToMarkdownOffset(root, position.offsetNode, position.offset);
  }
  const range = doc.caretRangeFromPoint?.(event.clientX, event.clientY);
  return range ? domPointToMarkdownOffset(root, range.startContainer, range.startOffset) : null;
}

export function wordRangeAtOffset(markdown: string, offset: number): MarkdownRange {
  let start = Math.max(0, Math.min(offset, markdown.length));
  let end = start;
  while (start > 0 && /[\p{L}\p{N}'-]/u.test(markdown[start - 1])) start -= 1;
  while (end < markdown.length && /[\p{L}\p{N}'-]/u.test(markdown[end])) end += 1;
  return start === end
    ? { spanStart: start, spanEnd: Math.min(markdown.length, start + 1) }
    : { spanStart: start, spanEnd: end };
}

export function textForRange(markdown: string, range: MarkdownRange | null): string {
  if (!range) return '';
  return markdown.slice(range.spanStart, range.spanEnd).trim();
}
