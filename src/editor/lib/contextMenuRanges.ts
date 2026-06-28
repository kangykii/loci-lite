export type VisibleTextRange = {
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

function domPointToVisibleTextOffset(
  root: HTMLElement,
  target: Node,
  offset: number,
): number | null {
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

export function selectedVisibleTextRange(root: HTMLElement): VisibleTextRange | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.anchorNode || !selection.focusNode) {
    return null;
  }
  if (!root.contains(selection.anchorNode) || !root.contains(selection.focusNode)) return null;

  const anchor = domPointToVisibleTextOffset(root, selection.anchorNode, selection.anchorOffset);
  const focus = domPointToVisibleTextOffset(root, selection.focusNode, selection.focusOffset);
  if (anchor === null || focus === null || anchor === focus) return null;
  return { spanStart: Math.min(anchor, focus), spanEnd: Math.max(anchor, focus) };
}

export function clickedVisibleTextOffset(root: HTMLElement, event: MouseEvent): number | null {
  const doc = document as DocumentWithCaret;
  const position = doc.caretPositionFromPoint?.(event.clientX, event.clientY);
  if (position) {
    return domPointToVisibleTextOffset(root, position.offsetNode, position.offset);
  }
  const range = doc.caretRangeFromPoint?.(event.clientX, event.clientY);
  return range
    ? domPointToVisibleTextOffset(root, range.startContainer, range.startOffset)
    : null;
}

export function wordRangeAtOffset(text: string, offset: number): VisibleTextRange {
  let start = Math.max(0, Math.min(offset, text.length));
  let end = start;
  while (start > 0 && /[\p{L}\p{N}'-]/u.test(text[start - 1])) start -= 1;
  while (end < text.length && /[\p{L}\p{N}'-]/u.test(text[end])) end += 1;
  return start === end
    ? { spanStart: start, spanEnd: Math.min(text.length, start + 1) }
    : { spanStart: start, spanEnd: end };
}

export function textForRange(text: string, range: VisibleTextRange | null): string {
  if (!range) return '';
  return text.slice(range.spanStart, range.spanEnd).trim();
}
