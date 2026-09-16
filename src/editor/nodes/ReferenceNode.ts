import {
  $applyNodeReplacement,
  TextNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
} from 'lexical';

export type SerializedReferenceNode = Spread<
  {
    citation: string;
    number: number;
  },
  SerializedTextNode
>;

/**
 * A reference is stored in Markdown as `[^citation]`, but renders as its
 * one-based position in the document. It intentionally has no atom id: a
 * reference belongs to the note's Markdown, never the bookmarks database.
 */
export class ReferenceNode extends TextNode {
  __citation: string;
  __number: number;

  static getType(): string {
    return 'reference';
  }

  static clone(node: ReferenceNode): ReferenceNode {
    return new ReferenceNode(node.__citation, node.__number, node.__key);
  }

  constructor(citation: string, number = 0, key?: NodeKey) {
    super(String(number || 1), key);
    this.__citation = citation;
    this.__number = number;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    this.applyMetadataToDOM(dom);
    return dom;
  }

  updateDOM(prevNode: ReferenceNode, dom: HTMLElement, config: EditorConfig): boolean {
    const shouldReplace = super.updateDOM(prevNode as this, dom, config);
    this.applyMetadataToDOM(dom);
    return shouldReplace;
  }

  applyMetadataToDOM(dom: HTMLElement): void {
    dom.classList.add('editor-reference');
    dom.dataset.referenceNumber = String(this.__number || 1);
    dom.title = this.__citation;
    dom.setAttribute('aria-label', `Reference ${this.__number || 1}: ${this.__citation}`);
  }

  setNumber(number: number): this {
    const writable = this.getWritable();
    writable.__number = number;
    writable.__text = String(number);
    return writable as this;
  }

  static importJSON(serializedNode: SerializedReferenceNode): ReferenceNode {
    const node = $createReferenceNode(serializedNode.citation, serializedNode.number);
    return node.updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedReferenceNode {
    return {
      ...super.exportJSON(),
      citation: this.__citation,
      number: this.__number,
      type: 'reference',
    };
  }

  isTextEntity(): true {
    return true;
  }
}

export function $createReferenceNode(citation: string, number = 0): ReferenceNode {
  const node = new ReferenceNode(citation.trim(), number).setMode('token');
  node.setFormat('superscript');
  return $applyNodeReplacement(node);
}

export function $isReferenceNode(
  node: LexicalNode | null | undefined,
): node is ReferenceNode {
  return node instanceof ReferenceNode;
}
