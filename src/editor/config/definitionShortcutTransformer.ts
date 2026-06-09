import type { TextMatchTransformer } from '@lexical/markdown';
import { $replaceDefinitionShortcut } from '../lib/definitionShortcutReplace';
import { AtomNode } from '../nodes/AtomNode';

export const DEFINITION_SHORTCUT: TextMatchTransformer = {
  dependencies: [AtomNode],
  regExp: /^\{([^|{}]+)\s*\|\s*([^}]+)\}$/,
  trigger: '}',
  type: 'text-match',
  replace: (textNode, match) => {
    $replaceDefinitionShortcut(textNode, match);
  },
};
