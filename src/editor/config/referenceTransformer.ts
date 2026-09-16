import type { TextMatchTransformer } from '@lexical/markdown';
import { $createReferenceNode, $isReferenceNode, ReferenceNode } from '../nodes/ReferenceNode';

const REFERENCE_PATTERN = /\[\^([^\]\n]+)\]/;

/** Markdown references use the compact, portable inline form `[^AGLC4]`. */
export const REFERENCE: TextMatchTransformer = {
  dependencies: [ReferenceNode],
  export: (node) =>
    $isReferenceNode(node) ? `[^${node.__citation.replace(/\]/g, '\\]')}]` : null,
  importRegExp: new RegExp(REFERENCE_PATTERN.source),
  regExp: new RegExp(`${REFERENCE_PATTERN.source}$`),
  replace: (textNode, match) => {
    const citation = match[1]?.trim();
    if (citation) {
      textNode.replace($createReferenceNode(citation));
    }
  },
  trigger: ']',
  type: 'text-match',
};
