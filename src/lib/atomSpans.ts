export type MarkdownSpan = {
  spanStart: number;
  spanEnd: number;
};

export function findSpanInMarkdown(
  markdown: string,
  selectedText: string,
): MarkdownSpan | null {
  const needle = selectedText.trim();
  if (!needle) {
    return null;
  }

  const index = markdown.indexOf(needle);
  if (index === -1) {
    return null;
  }

  return {
    spanStart: index,
    spanEnd: index + needle.length,
  };
}

export function resolveAtomSpans(
  markdown: string,
  selectedText: string,
  spanStart: number | null,
  spanEnd: number | null,
): MarkdownSpan | null {
  if (spanStart !== null && spanEnd !== null && spanEnd > spanStart) {
    return { spanStart, spanEnd };
  }

  return findSpanInMarkdown(markdown, selectedText);
}
