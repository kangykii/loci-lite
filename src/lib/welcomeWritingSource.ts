const MIN_PROSE_CHARS = 420;

function proseLines(markdown: string): string[] {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (/^#{1,6}\s/.test(line)) return false;
      if (/^```/.test(line)) return false;
      if (/^[-*+]\s+/.test(line)) return false;
      if (/^\d+\.\s+/.test(line)) return false;
      if (/^\|.*\|$/.test(line)) return false;
      if (/^- \[[ xX]\]\s+/.test(line)) return false;
      return true;
    });
}

export function isLikelyWritingMarkdown(markdown: string): boolean {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return false;
  }

  const fencedCodeChars = Array.from(trimmed.matchAll(/```[\s\S]*?```/g)).reduce(
    (total, match) => total + match[0].length,
    0,
  );
  if (fencedCodeChars / trimmed.length > 0.25) {
    return false;
  }

  const lines = trimmed.split('\n').filter(Boolean);
  const structuralLines = lines.filter((line) =>
    /^\s*(#{1,6}\s|[-*+]\s+|\d+\.\s+|- \[[ xX]\]\s+|\|.*\|$)/.test(line),
  );
  if (lines.length > 0 && structuralLines.length / lines.length > 0.55) {
    return false;
  }

  const prose = proseLines(trimmed).join(' ');
  if (prose.length < MIN_PROSE_CHARS) {
    return false;
  }

  const sentenceCount = (prose.match(/[.!?](\s|$)/g) ?? []).length;
  return sentenceCount >= 4;
}
