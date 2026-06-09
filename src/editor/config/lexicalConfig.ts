import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { HorizontalRuleNode } from '@lexical/extension';
import type { InitialConfigType } from '@lexical/react/LexicalComposer';
import { $getRoot, type LexicalEditor } from 'lexical';
import { AtomNode } from '../nodes/AtomNode';
import { AuthorshipNode } from '../nodes/AuthorshipNode';
import { markdownTransformers } from './markdownTransformers';

export const editorTheme = {
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  list: {
    ul: 'editor-list-ul',
    ol: 'editor-list-ol',
    listitem: 'editor-list-item',
    nested: {
      listitem: 'editor-list-item-nested',
    },
  },
  quote: 'editor-quote',
  code: 'editor-code-block',
  codeHighlight: {
    atrule: 'editor-token-attr',
    attr: 'editor-token-attr',
    boolean: 'editor-token-property',
    builtin: 'editor-token-selector',
    cdata: 'editor-token-comment',
    char: 'editor-token-selector',
    class: 'editor-token-function',
    comment: 'editor-token-comment',
    constant: 'editor-token-property',
    deleted: 'editor-token-property',
    doctype: 'editor-token-comment',
    entity: 'editor-token-operator',
    function: 'editor-token-function',
    important: 'editor-token-variable',
    inserted: 'editor-token-selector',
    keyword: 'editor-token-attr',
    namespace: 'editor-token-variable',
    number: 'editor-token-property',
    operator: 'editor-token-operator',
    prolog: 'editor-token-comment',
    property: 'editor-token-property',
    punctuation: 'editor-token-punctuation',
    regex: 'editor-token-variable',
    selector: 'editor-token-selector',
    string: 'editor-token-selector',
    symbol: 'editor-token-property',
    tag: 'editor-token-property',
    url: 'editor-token-operator',
    variable: 'editor-token-variable',
  },
  hr: 'editor-hr',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    strikethrough: 'editor-text-strikethrough',
    code: 'editor-text-code',
  },
};

function seedEditorFromMarkdown(editor: LexicalEditor, markdown: string) {
  editor.update(() => {
    const root = $getRoot();
    root.clear();
    $convertFromMarkdownString(markdown, markdownTransformers);
  });
}

export function createEditorConfig(initialMarkdown?: string): InitialConfigType {
  return {
    namespace: 'LociLite',
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      HorizontalRuleNode,
      AtomNode,
      AuthorshipNode,
    ],
    theme: editorTheme,
    onError(error: Error) {
      throw error;
    },
    editorState: initialMarkdown
      ? (editor) => {
          seedEditorFromMarkdown(editor, initialMarkdown);
        }
      : undefined,
  };
}
