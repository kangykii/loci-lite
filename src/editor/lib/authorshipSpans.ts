import type {
  AuthorshipAnnotationItem,
  ReconciledAnnotationDetail,
} from '../context/AuthorshipEditorContext';

export type VisibleTextChange = {
  changeStart: number;
  oldChangeEnd: number;
  insertedLength: number;
};

export function diffVisibleText(previous: string, next: string): VisibleTextChange {
  let prefix = 0;
  while (
    prefix < previous.length &&
    prefix < next.length &&
    previous[prefix] === next[prefix]
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < previous.length - prefix &&
    suffix < next.length - prefix &&
    previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  return {
    changeStart: prefix,
    oldChangeEnd: previous.length - suffix,
    insertedLength: next.length - prefix - suffix,
  };
}

function reconcileOneAnnotation(
  annotation: AuthorshipAnnotationItem,
  change: VisibleTextChange,
): ReconciledAnnotationDetail[] {
  const removedLength = change.oldChangeEnd - change.changeStart;
  const delta = change.insertedLength - removedLength;

  if (annotation.spanEnd <= change.changeStart) {
    return [annotation];
  }

  if (annotation.spanStart >= change.oldChangeEnd) {
    return [
      {
        ...annotation,
        spanStart: annotation.spanStart + delta,
        spanEnd: annotation.spanEnd + delta,
      },
    ];
  }

  const pieces: ReconciledAnnotationDetail[] = [];
  const leftEnd = Math.min(annotation.spanEnd, change.changeStart);
  if (annotation.spanStart < leftEnd) {
    pieces.push({
      id: annotation.id,
      source: annotation.source,
      spanStart: annotation.spanStart,
      spanEnd: leftEnd,
    });
  }

  const rightStart = Math.max(annotation.spanStart, change.oldChangeEnd);
  if (rightStart < annotation.spanEnd) {
    pieces.push({
      id: pieces.length === 0 ? annotation.id : crypto.randomUUID(),
      source: annotation.source,
      spanStart: rightStart + delta,
      spanEnd: annotation.spanEnd + delta,
    });
  }

  return pieces.filter((piece) => piece.spanStart < piece.spanEnd);
}

export function reconcileVisibleTextAnnotations(
  change: VisibleTextChange,
  annotations: AuthorshipAnnotationItem[],
): ReconciledAnnotationDetail[] {
  return annotations.flatMap((annotation) => reconcileOneAnnotation(annotation, change));
}

export function insertedVisibleTextRange(
  change: VisibleTextChange,
): { spanStart: number; spanEnd: number } | null {
  if (change.insertedLength <= 0) {
    return null;
  }

  return {
    spanStart: change.changeStart,
    spanEnd: change.changeStart + change.insertedLength,
  };
}
