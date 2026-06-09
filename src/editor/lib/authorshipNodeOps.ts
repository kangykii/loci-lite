import {
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  $isTextNode,
  type LexicalNode,
  type NodeKey,
  type TextNode,
} from 'lexical';
import { $isAuthorshipNode, type AuthorshipSource } from '../nodes/AuthorshipNode';
import { buildAuthorshipDocIndex } from './authorshipIndex';

export type AuthorshipRun = {
  spanStart: number;
  spanEnd: number;
  source: AuthorshipSource;
};

export function getAuthorshipAnnotationId(node: TextNode): string | null {
  const latest = node.getLatest();

  if ($isAuthorshipNode(latest)) {
    return latest.__annotationId;
  }

  return null;
}

export function getAuthorshipSource(node: TextNode): AuthorshipSource | null {
  const latest = node.getLatest();

  if ($isAuthorshipNode(latest)) {
    return latest.__source;
  }

  return null;
}

export function hasAuthorshipAnnotation(annotationId: string): boolean {
  let found = false;

  visitTextNodes((node) => {
    if (getAuthorshipAnnotationId(node) === annotationId) {
      found = true;
    }
  });

  return found;
}

export function removeAuthorshipNode(nodeKey: NodeKey): void {
  const node = $getNodeByKey(nodeKey);
  if (!$isAuthorshipNode(node)) {
    return;
  }

  node.replace($createTextNode(node.getTextContent()));
}

export function removeAuthorshipDecoration(annotationId: string): void {
  visitTextNodes((node) => {
    if (getAuthorshipAnnotationId(node) !== annotationId) {
      return;
    }

    if ($isAuthorshipNode(node)) {
      node.replace($createTextNode(node.getTextContent()));
    }
  });
}

export function getAuthorshipRuns(annotationId: string): AuthorshipRun[] {
  const { docText, slices } = buildAuthorshipDocIndex();
  const runs: AuthorshipRun[] = [];

  for (const slice of slices) {
    const node = slice.node.getLatest();
    if (getAuthorshipAnnotationId(node) !== annotationId) {
      continue;
    }

    const source = getAuthorshipSource(node) ?? 'paste';
    const last = runs[runs.length - 1];
    const gap = last ? docText.slice(last.spanEnd, slice.docStart) : '';
    if (last && last.source === source && (gap === '' || gap === '\n\n')) {
      last.spanEnd = slice.docEnd;
      continue;
    }

    runs.push({ spanStart: slice.docStart, spanEnd: slice.docEnd, source });
  }

  return runs;
}

function visitTextNodes(visit: (node: TextNode) => void): void {
  function walk(node: LexicalNode): void {
    if ($isTextNode(node)) {
      visit(node);
      return;
    }

    if ($isElementNode(node)) {
      for (const child of node.getChildren()) {
        walk(child);
      }
    }
  }

  walk($getRoot());
}
