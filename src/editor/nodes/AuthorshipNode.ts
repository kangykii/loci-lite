import {
  $applyNodeReplacement,
  TextNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
} from 'lexical';

export type AuthorshipSource = 'paste' | 'ai';

export type SerializedAuthorshipNode = Spread<
  {
    annotationId: string;
    source: AuthorshipSource;
  },
  SerializedTextNode
>;

export class AuthorshipNode extends TextNode {
  __annotationId: string;
  __source: AuthorshipSource;

  static getType(): string {
    return 'authorship';
  }

  static clone(node: AuthorshipNode): AuthorshipNode {
    return new AuthorshipNode(
      node.__text,
      node.__annotationId,
      node.__source,
      node.__key,
    );
  }

  constructor(
    text: string,
    annotationId: string,
    source: AuthorshipSource,
    key?: NodeKey,
  ) {
    super(text, key);
    this.__annotationId = annotationId;
    this.__source = source;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add(`authorship-${this.__source}`);
    dom.dataset.annotationId = this.__annotationId;
    return dom;
  }

  static importJSON(serializedNode: SerializedAuthorshipNode): AuthorshipNode {
    const node = $createAuthorshipNode(
      serializedNode.text,
      serializedNode.annotationId,
      serializedNode.source,
    );
    return node.updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedAuthorshipNode {
    return {
      ...super.exportJSON(),
      annotationId: this.__annotationId,
      source: this.__source,
      type: 'authorship',
    };
  }

}

export function $createAuthorshipNode(
  text: string,
  annotationId: string,
  source: AuthorshipSource,
): AuthorshipNode {
  return $applyNodeReplacement(new AuthorshipNode(text, annotationId, source));
}

export function $isAuthorshipNode(
  node: LexicalNode | null | undefined,
): node is AuthorshipNode {
  return node instanceof AuthorshipNode;
}
