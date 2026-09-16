import { outlineEntriesFromMarkdown } from './outlineNavigation';
import { convertFileSrc } from '@tauri-apps/api/core';
import { isTauri } from './tauri';

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
  return '';
}

const EXCERPT_MAX_LENGTH = 200;

export function filenameFromPath(path: string): string {
  return path.split(/[/\\]/).pop() ?? 'note.md';
}

export function titleFromUploadFilename(filename: string): string {
  return filename.replace(/\.[^./\\]+$/, '').trim();
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

/** Returns the first Markdown image as a displayable local or remote cover. */
export function previewImageFromMarkdown(markdown: string, notePath: string): string | null {
  const source = markdown.match(/!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\s*\)/)?.[1]
    ?? markdown.match(/!\[[^\]]*\]\(\s*(?:<[^>]+>|([^\s)]+))(?:\s+[^)]*)?\s*\)/)?.[1];
  if (!source) return null;

  if (/^(https?:|data:)/i.test(source)) return source;
  if (!isTauri()) return null;

  const normalized = source.replace(/^file:\/\//i, '').replace(/\//g, '\\');
  const isAbsolute = /^[a-z]:\\/i.test(normalized) || normalized.startsWith('\\\\');
  const separator = Math.max(notePath.lastIndexOf('/'), notePath.lastIndexOf('\\'));
  const resolved = isAbsolute ? normalized : `${notePath.slice(0, separator + 1)}${normalized}`;
  return convertFileSrc(decodeURIComponent(resolved));
}

function escapeSvgText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** A quiet visual stand-in for the editor when a note has no Markdown image. */
export function editorSnapshotFromMarkdown(markdown: string, title: string): string {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('![') && !line.startsWith('```'))
    .map((line) => line.replace(/^#{1,6}\s+/, '').replace(/[*_`>#]/g, '').trim())
    .filter(Boolean)
    .slice(0, 3);
  const content = lines.length > 0 ? lines : [''];
  const textRows = content.map((line, index) =>
    `<text x="52" y="${166 + index * 45}" fill="#756d63" font-family="Georgia, serif" font-size="22">${escapeSvgText(line.slice(0, 48))}</text>`,
  ).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#fbf7ef"/><rect x="40" y="35" width="4" height="278" rx="2" fill="#efe7d9"/><text x="52" y="105" fill="#1d150e" font-family="Georgia, serif" font-size="32" font-weight="600">${escapeSvgText(title.slice(0, 36))}</text><path d="M52 128h536" stroke="#e4dbcc"/>${textRows}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function outlineHeadingsFromMarkdown(markdown: string): string[] {
  return outlineEntriesFromMarkdown(markdown).map((entry) => entry.text);
}
