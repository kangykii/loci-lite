import { $createTextNode, $getNodeByKey } from 'lexical';
import { $isAtomNode } from '../nodes/AtomNode';

export function $revertDefinitionShortcut(nodeKey: string, term: string): void {
  const node = $getNodeByKey(nodeKey);
  if (!node || !$isAtomNode(node)) {
    return;
  }

  node.replace($createTextNode(term));
}
