import { $getRoot, $isElementNode, $isTextNode, type LexicalNode, type TextNode } from 'lexical';

export type DocTextSlice = {
  node: TextNode;
  docStart: number;
  docEnd: number;
};

export type VisibleTextIndex = {
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

function nodeTextContentLength(node: LexicalNode): number {
  if ($isTextNode(node)) {
    return node.getTextContent().length;
  }

  if ($isElementNode(node)) {
    return node.getChildren().reduce(
      (length, child) => length + nodeTextContentLength(child),
      0,
    );
  }

  return 0;
}

function nodeContainsKey(node: LexicalNode, key: string): boolean {
  if (node.getKey() === key) {
    return true;
  }

  return $isElementNode(node) && node.getChildren().some((child) => nodeContainsKey(child, key));
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

function pointOffsetWithinNode(
  node: LexicalNode,
  targetKey: string,
  targetOffset: number,
  currentOffset: number,
): number | null {
  if (node.getKey() === targetKey) {
    if ($isTextNode(node)) {
      return currentOffset + Math.max(0, Math.min(targetOffset, node.getTextContent().length));
    }

    if ($isElementNode(node)) {
      const children = node.getChildren();
      const beforeChildren = children.slice(0, Math.max(0, Math.min(targetOffset, children.length)));
      return (
        currentOffset +
        beforeChildren.reduce((length, child) => length + nodeTextContentLength(child), 0)
      );
    }

    return currentOffset;
  }

  if (!$isElementNode(node)) {
    return null;
  }

  let childOffset = currentOffset;
  for (const child of node.getChildren()) {
    if (nodeContainsKey(child, targetKey)) {
      return pointOffsetWithinNode(child, targetKey, targetOffset, childOffset);
    }

    childOffset += nodeTextContentLength(child);
  }

  return null;
}

export function buildVisibleTextIndex(): VisibleTextIndex {
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

export type VisibleTextPoint = {
  getNode: () => LexicalNode;
  offset: number;
};

export function getVisibleTextOffsetForPoint(point: VisibleTextPoint): number | null {
  const targetNode = point.getNode();
  const targetKey = targetNode.getKey();
  let currentOffset = 0;
  let previousBlockHadText = false;

  for (const child of $getRoot().getChildren()) {
    if (nodeContainsKey(child, targetKey)) {
      if (previousBlockHadText) {
        currentOffset += 2;
      }

      return pointOffsetWithinNode(child, targetKey, point.offset, currentOffset);
    }

    if (!nodeHasTextContent(child)) {
      continue;
    }

    if (previousBlockHadText) {
      currentOffset += 2;
    }

    currentOffset += nodeTextContentLength(child);
    previousBlockHadText = true;
  }

  return null;
}
