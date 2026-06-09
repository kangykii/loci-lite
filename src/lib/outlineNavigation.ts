import { scrollElementIntoEditorView } from './scrollEditorTarget';

export type OutlineEntry = {
  level: number;
  text: string;
  index: number;
};

const HEADING_SELECTOR = 'h1,h2,h3,h4,h5,h6';

export function outlineEntriesFromMarkdown(markdown: string): OutlineEntry[] {
  const entries: OutlineEntry[] = [];

  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match?.[1] && match[2]) {
      entries.push({
        level: match[1].length,
        text: match[2].trim(),
        index: entries.length,
      });
    }
  }

  return entries;
}

export function getEditorHeadingElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(HEADING_SELECTOR));
}

export function scrollToOutlineHeading(root: HTMLElement | null, headingIndex: number): void {
  if (!root || headingIndex < 0) return;

  const heading = getEditorHeadingElements(root)[headingIndex];
  if (heading) scrollElementIntoEditorView(heading);
}
