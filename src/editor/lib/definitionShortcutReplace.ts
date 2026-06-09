import { $isCodeNode } from '@lexical/code';
import { $findMatchingParent, IS_CODE, type TextNode } from 'lexical';
import { $createAtomNode, $isAtomNode } from '../nodes/AtomNode';
import { invokeDefinitionShortcut } from './definitionShortcutBridge';
import {
  DEFINITION_SHORTCUT_MAX_DEFINITION,
  DEFINITION_SHORTCUT_MAX_TERM,
} from './definitionShortcutLimits';

function isInsideCodeBlock(textNode: TextNode): boolean {
  return $findMatchingParent(textNode, $isCodeNode) !== null;
}

function isValidTerm(term: string): boolean {
  const trimmed = term.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= DEFINITION_SHORTCUT_MAX_TERM &&
    !/[{}|]/.test(trimmed)
  );
}

function isValidDefinition(definition: string): boolean {
  const trimmed = definition.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= DEFINITION_SHORTCUT_MAX_DEFINITION &&
    !/}/.test(trimmed)
  );
}

function isInlineCode(textNode: TextNode): boolean {
  return (textNode.getFormat() & IS_CODE) !== 0;
}

export function $replaceDefinitionShortcut(
  textNode: TextNode,
  match: RegExpMatchArray,
): void {
  const [, rawTerm, rawDefinition] = match;
  if (!rawTerm || !rawDefinition) {
    return;
  }

  const term = rawTerm.trim();
  const definition = rawDefinition.trim();
  if (!isValidTerm(term) || !isValidDefinition(definition)) {
    return;
  }

  if ($isAtomNode(textNode) || isInsideCodeBlock(textNode) || isInlineCode(textNode)) {
    return;
  }

  const atomId = crypto.randomUUID();
  const atomNode = $createAtomNode(term, atomId, 'definition', definition);
  textNode.replace(atomNode);

  invokeDefinitionShortcut({
    atomId,
    term,
    definition,
    nodeKey: atomNode.getKey(),
    spanStart: null,
    spanEnd: null,
  });
}
