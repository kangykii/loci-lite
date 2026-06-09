import { $getRoot, $isElementNode, $isTextNode, type LexicalNode, type TextNode } from 'lexical';

export type TextMatch = {
  node: TextNode;
  start: number;
  end: number;
};

export type DocTextSlice = {
  node: TextNode;
  docStart: number;
  docEnd: number;
};

export type AuthorshipDocIndex = {
  slices: DocTextSlice[];
  docText: string;
};

function nodeHasTextContent(node: LexicalNode): boolean {
  if ($isTextNode(node)) {
    return node.getTextContent().length > 0;
  }

  if ($isElementNode(node)) {
    return node.getChildren().some((child) => nodeHasTextContent(child));
  }

  return false;
}

function appendNodeText(node: LexicalNode, slices: DocTextSlice[], docText: string): string {
  if ($isTextNode(node)) {
    const text = node.getTextContent();
    if (!text) {
      return docText;
    }

    slices.push({
      node,
      docStart: docText.length,
      docEnd: docText.length + text.length,
    });
    return docText + text;
  }

  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      docText = appendNodeText(child, slices, docText);
    }
  }

  return docText;
}

export function buildAuthorshipDocIndex(): AuthorshipDocIndex {
  const slices: DocTextSlice[] = [];
  let docText = '';
  let previousBlockHadText = false;

  for (const child of $getRoot().getChildren()) {
    if (!nodeHasTextContent(child)) {
      continue;
    }

    if (previousBlockHadText) {
      docText += '\n\n';
    }

    docText = appendNodeText(child, slices, docText);
    previousBlockHadText = true;
  }

  return { slices, docText };
}

export function countOccurrencesBefore(markdown: string, needle: string, offset: number): number {
  let count = 0;
  let from = 0;

  while (from < offset) {
    const index = markdown.indexOf(needle, from);
    if (index === -1 || index >= offset) {
      break;
    }

    count += 1;
    from = index + needle.length;
  }

  return count;
}

function mapRangeToSegments(
  slices: DocTextSlice[],
  matchStart: number,
  matchEnd: number,
): TextMatch[] {
  return slices.flatMap((slice) => {
    const overlapStart = Math.max(matchStart, slice.docStart);
    const overlapEnd = Math.min(matchEnd, slice.docEnd);

    if (overlapStart >= overlapEnd) {
      return [];
    }

    return {
      node: slice.node,
      start: overlapStart - slice.docStart,
      end: overlapEnd - slice.docStart,
    };
  });
}

export function findCrossNodeTextMatch(
  searchText: string,
  occurrenceIndex: number,
): TextMatch[] | null {
  if (!searchText) {
    return null;
  }

  const { slices, docText } = buildAuthorshipDocIndex();
  let from = 0;
  let occurrence = 0;

  while (from <= docText.length - searchText.length) {
    const index = docText.indexOf(searchText, from);
    if (index === -1) {
      return null;
    }

    if (occurrence === occurrenceIndex) {
      return mapRangeToSegments(slices, index, index + searchText.length);
    }

    occurrence += 1;
    from = index + searchText.length;
  }

  return null;
}

export function findLastCrossNodeTextMatch(searchText: string): TextMatch[] | null {
  const { slices, docText } = buildAuthorshipDocIndex();
  const matchStart = searchText ? docText.lastIndexOf(searchText) : -1;

  if (matchStart === -1) {
    return null;
  }

  return mapRangeToSegments(slices, matchStart, matchStart + searchText.length);
}

export function mapMarkdownSpanToTextMatches(
  spanStart: number,
  spanEnd: number,
): TextMatch[] {
  if (spanStart < 0 || spanEnd <= spanStart) {
    return [];
  }

  const { slices } = buildAuthorshipDocIndex();
  return mapRangeToSegments(slices, spanStart, spanEnd);
}

export function getTextNodeDocOffset(nodeKey: string, offset: number): number | null {
  const { slices } = buildAuthorshipDocIndex();
  const slice = slices.find((entry) => entry.node.getKey() === nodeKey);
  if (!slice) {
    return null;
  }

  return slice.docStart + Math.max(0, Math.min(offset, slice.docEnd - slice.docStart));
}
