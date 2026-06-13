export function withMarkdownTitle(markdown: string, title: string): string {
  const cleanTitle = title.trim() || 'Untitled';
  if (/^#\s+.+$/m.test(markdown)) {
    return markdown.replace(/^#\s+.+$/m, `# ${cleanTitle}`);
  }
  return `# ${cleanTitle}\n\n${markdown.trimStart()}`;
}
