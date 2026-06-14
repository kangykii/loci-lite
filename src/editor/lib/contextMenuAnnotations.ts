import type { AuthorshipAnnotationItem } from '../context/AuthorshipEditorContext';
import type { MarkdownRange } from './contextMenuRanges';

export function findIntersectingAnnotation(
  annotations: AuthorshipAnnotationItem[],
  range: MarkdownRange | null,
): AuthorshipAnnotationItem | null {
  if (!range) return null;
  const matches = annotations.filter(
    (annotation) =>
      annotation.spanStart < range.spanEnd && range.spanStart < annotation.spanEnd,
  );
  return matches.sort(
    (left, right) =>
      left.spanEnd - left.spanStart - (right.spanEnd - right.spanStart),
  )[0] ?? null;
}

export function intersectionRange(
  annotation: AuthorshipAnnotationItem | null,
  range: MarkdownRange | null,
): MarkdownRange | null {
  if (!annotation || !range) return null;
  return {
    spanStart: Math.max(annotation.spanStart, range.spanStart),
    spanEnd: Math.min(annotation.spanEnd, range.spanEnd),
  };
}
