import { outlineEntriesFromMarkdown } from './outlineNavigation';

const MAX_SLUG_LENGTH = 60;

export function slugify(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    return 'untitled';
  }

  return slug.slice(0, MAX_SLUG_LENGTH);
}

export function uniqueSlug(baseSlug: string, exists: (slug: string) => boolean): string {
  const root = slugify(baseSlug);

  if (!exists(root)) {
    return root;
  }

  let suffix = 2;
  while (exists(`${root}-${suffix}`)) {
    suffix += 1;
  }

  return `${root}-${suffix}`;
}

export function titleFromMarkdown(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  const title = match?.[1]?.trim();
  return title ? title : null;
}

export function humanizeStem(filename: string): string {
  const stem = filename.replace(/\.md$/i, '').trim();
  if (!stem) {
    return 'Untitled';
  }

  return stem
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function displayTitleFromMarkdown(markdown: string, filename: string): string {
  return titleFromMarkdown(markdown) ?? humanizeStem(filename);
}

export function defaultNewNoteMarkdown(): string {
  return '# Untitled\n\n';
}

const EXCERPT_MAX_LENGTH = 200;

export function filenameFromPath(path: string): string {
  return path.split(/[/\\]/).pop() ?? 'note.md';
}

export function displayTitleForFile(
  title: string | null,
  path: string,
): string {
  if (title?.trim()) {
    return title.trim();
  }

  return humanizeStem(filenameFromPath(path));
}

export function excerptFromMarkdown(markdown: string, maxLength = EXCERPT_MAX_LENGTH): string {
  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      continue;
    }

    if (/^```/.test(trimmed)) {
      continue;
    }

    if (/^>\s/.test(trimmed)) {
      const quote = trimmed.replace(/^>\s*/, '').trim();
      if (quote) {
        return quote.length > maxLength ? `${quote.slice(0, maxLength)}…` : quote;
      }
      continue;
    }

    const plain = trimmed
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .trim();

    if (!plain) {
      continue;
    }

    return plain.length > maxLength ? `${plain.slice(0, maxLength)}…` : plain;
  }

  return '';
}

export function outlineHeadingsFromMarkdown(markdown: string): string[] {
  return outlineEntriesFromMarkdown(markdown).map((entry) => entry.text);
}
