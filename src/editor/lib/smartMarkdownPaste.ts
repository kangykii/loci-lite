import { $convertFromMarkdownString } from '@lexical/markdown';
import { createEditor, type SerializedLexicalNode } from 'lexical';
import { editorNodes } from '../config/lexicalConfig';
import { markdownTransformers } from '../config/markdownTransformers';

const MARKDOWN_LINE_PATTERNS = [
  /^#{1,6}\s+\S/m,
  /^\s{0,3}[-*+]\s+\S/m,
  /^\s{0,3}\d+[.)]\s+\S/m,
  /^\s{0,3}>\s+\S/m,
  /^\s{0,3}(?:---|\*\*\*|___)\s*$/m,
  /^```[\s\S]*```$/m,
];

const OUTER_MARKDOWN_FENCE_PATTERN =
  /^\s*```(?:markdown|md)\s*\n([\s\S]*?)\n```\s*$/i;

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function collapseExcessBlankLinesOutsideCode(value: string): string {
  const lines = value.split('\n');
  const normalizedLines: string[] = [];
  let inCodeFence = false;
  let blankRun = 0;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      blankRun = 0;
      normalizedLines.push(line);
      continue;
    }

    if (!inCodeFence && line.trim() === '') {
      blankRun += 1;
      if (blankRun <= 1) {
        normalizedLines.push('');
      }
      continue;
    }

    blankRun = 0;
    normalizedLines.push(line);
  }

  return normalizedLines.join('\n');
}

export function unwrapOuterMarkdownFence(value: string): string {
  const normalized = normalizeNewlines(value).trim();
  const match = normalized.match(OUTER_MARKDOWN_FENCE_PATTERN);
  return match?.[1]?.trim() ?? normalized;
}

export function normalizeSmartMarkdownPaste(value: string): string {
  return collapseExcessBlankLinesOutsideCode(unwrapOuterMarkdownFence(value));
}

export function isLikelySmartMarkdownPaste(value: string): boolean {
  const markdown = normalizeSmartMarkdownPaste(value);

  if (!markdown.includes('\n')) {
    return false;
  }

  return MARKDOWN_LINE_PATTERNS.some((pattern) => pattern.test(markdown));
}

export function markdownPasteToSerializedNodes(
  value: string,
): SerializedLexicalNode[] | null {
  if (!isLikelySmartMarkdownPaste(value)) {
    return null;
  }

  const markdown = normalizeSmartMarkdownPaste(value);
  const parser = createEditor({
    editable: false,
    namespace: 'LociSmartMarkdownPaste',
    nodes: editorNodes,
    onError(error) {
      throw error;
    },
  });

  parser.update(
    () => {
      $convertFromMarkdownString(markdown, markdownTransformers, undefined, true);
    },
    { discrete: true },
  );

  const children = parser.getEditorState().toJSON().root.children;
  return children.length > 0 ? children : null;
}
