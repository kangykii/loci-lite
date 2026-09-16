import { scrollElementIntoEditorView } from './scrollEditorTarget';

export type HeadingOutlineEntry = {
  kind: 'heading';
  level: number;
  text: string;
  index: number;
};

export type ReferenceOutlineEntry = {
  kind: 'reference';
  number: number;
  text: string;
  index: number;
};

export type OutlineEntry = HeadingOutlineEntry | ReferenceOutlineEntry;

const HEADING_SELECTOR = 'h1,h2,h3,h4,h5,h6';
const REFERENCE_PATTERN = /\[\^([^\]\n]+)\]/g;

export function outlineEntriesFromMarkdown(markdown: string): OutlineEntry[] {
  const entries: OutlineEntry[] = [];
  let headingIndex = 0;
  let referenceIndex = 0;

  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match?.[1] && match[2]) {
      entries.push({
        kind: 'heading',
        level: match[1].length,
        text: match[2].trim(),
        index: headingIndex,
      });
      headingIndex += 1;
    }

    for (const referenceMatch of line.matchAll(REFERENCE_PATTERN)) {
      const citation = referenceMatch[1]?.trim();
      if (!citation) {
        continue;
      }

      referenceIndex += 1;
      entries.push({
        kind: 'reference',
        number: referenceIndex,
        text: citation,
        index: referenceIndex,
      });
    }
  }

  return entries;
}

function normalizeOutlineText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function outlineEntriesForDisplay(
  entries: OutlineEntry[],
  documentTitle: string,
): OutlineEntry[] {
  const [firstEntry, ...restEntries] = entries;
  if (!firstEntry) return entries;

  if (
    firstEntry.kind === 'heading' &&
    normalizeOutlineText(firstEntry.text) === normalizeOutlineText(documentTitle)
  ) {
    return restEntries;
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

export function scrollToReference(root: HTMLElement | null, referenceNumber: number): void {
  if (!root || referenceNumber < 1) return;

  const reference = root.querySelector<HTMLElement>(
    `[data-reference-number="${referenceNumber}"]`,
  );
  if (reference) scrollElementIntoEditorView(reference);
}
