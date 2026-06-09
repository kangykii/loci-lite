import type { MarkdownSpan } from '../../lib/atomSpans';
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  type LexicalNode,
  type PointType,
  type TextNode,
} from 'lexical';

export type TextSegment = {
  node: TextNode;
  start: number;
  end: number;
};

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function clipboardInsertCharCount(text: string): number {
  return normalizeNewlines(text).replace(/\n/g, '').length;
}

type RelaxedTextMap = {
  relaxed: string;
  startOffsets: number[];
  endOffsets: number[];
};

function buildRelaxedTextMap(source: string): RelaxedTextMap {
  const startOffsets: number[] = [];
  const endOffsets: number[] = [];
  let relaxed = '';

  for (let index = 0; index < source.length; ) {
    if (source[index] === '\n') {
      let end = index;
      while (end < source.length && source[end] === '\n') {
        end += 1;
      }

      relaxed += '\n';
      startOffsets.push(index);
      endOffsets.push(end);
      index = end;
      continue;
    }

    relaxed += source[index];
    startOffsets.push(index);
    endOffsets.push(index + 1);
    index += 1;
  }

  return { relaxed, startOffsets, endOffsets };
}

export function findLastMarkdownSpanRelaxed(
  haystack: string,
  needle: string,
): MarkdownSpan | null {
  const exact = findLastMarkdownSpan(haystack, needle);
  if (exact) {
    return exact;
  }

  if (!needle) {
    return null;
  }

  const haystackMap = buildRelaxedTextMap(haystack);
  const needleMap = buildRelaxedTextMap(needle);
  const relaxedSpan = findLastMarkdownSpan(haystackMap.relaxed, needleMap.relaxed);

  if (!relaxedSpan) {
    return null;
  }

  const spanStart = haystackMap.startOffsets[relaxedSpan.spanStart];
  const spanEnd = haystackMap.endOffsets[relaxedSpan.spanEnd - 1];

  if (spanStart === undefined || spanEnd === undefined) {
    return null;
  }

  return { spanStart, spanEnd };
}

export function findLastMarkdownSpan(haystack: string, needle: string): MarkdownSpan | null {
  if (!needle) {
    return null;
  }

  let spanStart = -1;
  let from = 0;

  while (true) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) {
      break;
    }

    spanStart = index;
    from = index + needle.length;
  }

  if (spanStart === -1) {
    return null;
  }

  return {
    spanStart,
    spanEnd: spanStart + needle.length,
  };
}

function getLastTextDescendant(node: LexicalNode): TextNode | null {
  if ($isTextNode(node)) {
    return node;
  }

  if ($isElementNode(node)) {
    const children = node.getChildren();
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const found = getLastTextDescendant(children[index]);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function getLogicalPreviousTextNode(startNode: LexicalNode): TextNode | null {
  let node: LexicalNode | null = startNode;

  while (node) {
    const previousSibling = node.getPreviousSibling();
    if (previousSibling) {
      return getLastTextDescendant(previousSibling);
    }

    node = node.getParent();
  }

  return null;
}

function resolveTextPointFromAnchor(anchor: PointType): { node: TextNode; offset: number } | null {
  const node = anchor.getNode();

  if ($isTextNode(node)) {
    return { node, offset: anchor.offset };
  }

  if ($isElementNode(node)) {
    for (let index = anchor.offset - 1; index >= 0; index -= 1) {
      const child = node.getChildAtIndex(index);
      if (!child) {
        continue;
      }

      const textNode = getLastTextDescendant(child);
      if (textNode) {
        return { node: textNode, offset: textNode.getTextContent().length };
      }
    }

    const children = node.getChildren();
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const textNode = getLastTextDescendant(children[index]);
      if (textNode) {
        return { node: textNode, offset: textNode.getTextContent().length };
      }
    }
  }

  return null;
}

function collectInsertedPartsAfterPaste(
  charCount: number,
): { text: string; segments: TextSegment[] } | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || charCount <= 0) {
    return null;
  }

  if (!selection.isCollapsed()) {
    const selected = selection.getTextContent();
    if (selected) {
      return { text: selected, segments: [] };
    }
  }

  const point = resolveTextPointFromAnchor(selection.anchor);
  if (!point) {
    return null;
  }

  let remaining = charCount;
  let node: LexicalNode = point.node;
  let offset = point.offset;
  const chunks: string[] = [];
  const segments: TextSegment[] = [];

  while (remaining > 0) {
    if (!$isTextNode(node)) {
      const previous = getLogicalPreviousTextNode(node);
      if (!previous) {
        break;
      }

      node = previous;
      offset = node.getTextContent().length;
      continue;
    }

    const text = node.getTextContent();
    const take = Math.min(remaining, offset);
    if (take > 0) {
      const start = offset - take;
      chunks.unshift(text.slice(start, offset));
      segments.unshift({ node, start, end: offset });
      remaining -= take;
    }

    if (remaining <= 0) {
      break;
    }

    const previous = getLogicalPreviousTextNode(node);
    if (!previous) {
      break;
    }

    node = previous;
    offset = node.getTextContent().length;
  }

  if (remaining > 0) {
    return null;
  }

  return {
    text: chunks.join(''),
    segments,
  };
}

export function collectInsertedSegmentsAfterPaste(pasteText: string): TextSegment[] | null {
  const charCount = clipboardInsertCharCount(pasteText);
  const result = collectInsertedPartsAfterPaste(charCount);
  if (!result || result.segments.length === 0) {
    return null;
  }

  return result.segments;
}

export function collectInsertedTextAfterPaste(pasteText: string): string | null {
  const charCount = clipboardInsertCharCount(pasteText);
  const result = collectInsertedPartsAfterPaste(charCount);
  return result?.text ?? null;
}

export function resolvePasteSpanInMarkdown(
  markdown: string,
  clipboardText: string,
): MarkdownSpan | null {
  const normalizedMarkdown = normalizeNewlines(markdown);
  const normalizedClipboard = normalizeNewlines(clipboardText);

  const inserted = collectInsertedTextAfterPaste(normalizedClipboard);
  if (inserted) {
    const span = findLastMarkdownSpanRelaxed(normalizedMarkdown, inserted);
    if (span) {
      return span;
    }
  }

  return findLastMarkdownSpanRelaxed(normalizedMarkdown, normalizedClipboard);
}
