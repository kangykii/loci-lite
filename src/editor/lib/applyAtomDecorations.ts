import type { AtomType } from '../../lib/atomTypes';
import { $createAtomNode, $isAtomNode, AtomNode } from '../nodes/AtomNode';
import { $getRoot, $isTextNode, type LexicalNode, type TextNode } from 'lexical';

export type AtomDecorationTarget = {
  id: string;
  type: AtomType;
  content: string;
  sourceText: string;
};

type TextMatch = {
  node: TextNode;
  start: number;
  end: number;
};

function collectTextMatches(node: LexicalNode, searchText: string, matches: TextMatch[]): void {
  if ($isAtomNode(node)) {
    return;
  }

  if ($isTextNode(node)) {
    const text = node.getTextContent();
    let fromIndex = 0;

    while (fromIndex < text.length) {
      const index = text.indexOf(searchText, fromIndex);
      if (index === -1) {
        break;
      }

      matches.push({
        node,
        start: index,
        end: index + searchText.length,
      });
      fromIndex = index + searchText.length;
    }

    return;
  }

  if ('getChildren' in node && typeof node.getChildren === 'function') {
    for (const child of node.getChildren()) {
      collectTextMatches(child, searchText, matches);
    }
  }
}

function nodeHasAtomId(node: TextNode, atomId: string): boolean {
  if ($isAtomNode(node)) {
    return node.getLatest().__atomId === atomId;
  }

  return false;
}

function decorateMatch(
  node: TextNode,
  start: number,
  end: number,
  target: AtomDecorationTarget,
): void {
  const latest = node.getLatest();
  if (nodeHasAtomId(latest, target.id)) {
    return;
  }

  const text = latest.getTextContent();
  const matchText = text.slice(start, end);

  if (!matchText) {
    return;
  }

  let spanNode: TextNode = latest;

  if (end < text.length) {
    const split = spanNode.splitText(end);
    spanNode = split[0];
  }

  if (start > 0) {
    const split = spanNode.splitText(start);
    spanNode = split[1] ?? split[0];
  }

  if ($isAtomNode(spanNode) && spanNode.getLatest().__atomId === target.id) {
    return;
  }

  spanNode.replace($createAtomNode(matchText, target.id, target.type, target.content));
}

export function $applyAtomDecorations(targets: AtomDecorationTarget[]): void {
  if (targets.length === 0) {
    return;
  }

  const root = $getRoot();

  for (const target of targets) {
    const searchText = target.sourceText.trim();
    if (!searchText) {
      continue;
    }

    const matches: TextMatch[] = [];
    collectTextMatches(root, searchText, matches);

    const sorted = matches.sort((left, right) => {
      if (left.node.getKey() !== right.node.getKey()) {
        return left.node.getKey() < right.node.getKey() ? -1 : 1;
      }

      return right.start - left.start;
    });

    for (const match of sorted) {
      decorateMatch(match.node, match.start, match.end, target);
    }
  }
}

export function atomNodeFromTarget(target: AtomDecorationTarget): AtomNode {
  return $createAtomNode(target.sourceText, target.id, target.type, target.content);
}
