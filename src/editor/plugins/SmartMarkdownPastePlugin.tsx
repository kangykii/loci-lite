import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $addUpdateTag,
  $insertNodes,
  $parseSerializedNode,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  PASTE_TAG,
  type PasteCommandType,
} from 'lexical';
import { useEffect } from 'react';
import { markdownPasteToSerializedNodes } from '../lib/smartMarkdownPaste';

function readPastedText(event: PasteCommandType): string {
  return event instanceof ClipboardEvent
    ? event.clipboardData?.getData('text/plain') ?? ''
    : '';
}

function hasMeaningfulHtmlPaste(event: PasteCommandType): boolean {
  if (!(event instanceof ClipboardEvent)) {
    return false;
  }

  const html = event.clipboardData?.getData('text/html') ?? '';
  return html
    .replace(/<!--StartFragment-->|<!--EndFragment-->/g, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim().length > 0;
}

export default function SmartMarkdownPastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (hasMeaningfulHtmlPaste(event)) {
          return false;
        }

        const pastedText = readPastedText(event);
        if (!pastedText) {
          return false;
        }

        const parsedNodes = markdownPasteToSerializedNodes(pastedText);
        if (!parsedNodes) {
          return false;
        }

        event.preventDefault();
        $addUpdateTag(PASTE_TAG);
        const nodes = parsedNodes.map((node) => $parseSerializedNode(node));
        $insertNodes(nodes);
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}
