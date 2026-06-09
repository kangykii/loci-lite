import type { AtomType } from '../../lib/atomTypes';
import {
  $applyNodeReplacement,
  TextNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
} from 'lexical';

export type SerializedAtomNode = Spread<
  {
    atomId: string;
    atomType: AtomType;
    content: string;
  },
  SerializedTextNode
>;

export class AtomNode extends TextNode {
  __atomId: string;
  __atomType: AtomType;
  __content: string;

  static getType(): string {
    return 'atom';
  }

  static clone(node: AtomNode): AtomNode {
    return new AtomNode(
      node.__text,
      node.__atomId,
      node.__atomType,
      node.__content,
      node.__key,
    );
  }

  constructor(
    text: string,
    atomId: string,
    atomType: AtomType,
    content: string,
    key?: NodeKey,
  ) {
    super(text, key);
    this.__atomId = atomId;
    this.__atomType = atomType;
    this.__content = content;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    this.applyMetadataToDOM(dom);
    return dom;
  }

  updateDOM(prevNode: AtomNode, dom: HTMLElement, config: EditorConfig): boolean {
    this.applyMetadataToDOM(dom);
    return false;
  }

  applyMetadataToDOM(dom: HTMLElement): void {
    dom.classList.add(`atom-${this.__atomType}`);
    dom.dataset.atomId = this.__atomId;
    dom.dataset.atomType = this.__atomType;
    dom.dataset.atomContent = this.__content;
    dom.dataset.atomSource = this.getTextContent();
  }

  static importJSON(serializedNode: SerializedAtomNode): AtomNode {
    const node = $createAtomNode(
      serializedNode.text,
      serializedNode.atomId,
      serializedNode.atomType,
      serializedNode.content,
    );
    return node.updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedAtomNode {
    return {
      ...super.exportJSON(),
      atomId: this.__atomId,
      atomType: this.__atomType,
      content: this.__content,
      type: 'atom',
    };
  }

  isTextEntity(): true {
    return true;
  }
}

export function $createAtomNode(
  text: string,
  atomId: string,
  atomType: AtomType,
  content: string,
): AtomNode {
  return $applyNodeReplacement(
    new AtomNode(text, atomId, atomType, content).setMode('token'),
  );
}

export function $isAtomNode(node: LexicalNode | null | undefined): node is AtomNode {
  return node instanceof AtomNode;
}
