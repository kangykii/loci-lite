import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  PASTE_TAG,
  type PasteCommandType,
} from 'lexical';
import { useEffect, useRef } from 'react';
import { markdownTransformers } from '../config/markdownTransformers';
import {
  type AuthorshipAnnotationItem,
  type ReconciledAnnotationDetail,
  useAuthorshipEditorContext,
} from '../context/AuthorshipEditorContext';
import { NON_PERSISTENT_DECORATION_TAG } from '../lib/editorUpdateTags';
import {
  collectInsertedTextAfterPaste,
  findLastMarkdownSpanRelaxed,
  resolvePasteSpanInMarkdown,
} from '../lib/resolvePasteSpan';

function readPastedText(event: PasteCommandType): string {
  if (event instanceof ClipboardEvent) {
    return event.clipboardData?.getData('text/plain') ?? '';
  }

  return '';
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function diffMarkdown(previous: string, next: string) {
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
  changeStart: number,
  oldChangeEnd: number,
  insertedLength: number,
): ReconciledAnnotationDetail[] {
  const removedLength = oldChangeEnd - changeStart;
  const delta = insertedLength - removedLength;

  if (annotation.spanEnd <= changeStart) {
    return [annotation];
  }

  if (annotation.spanStart >= oldChangeEnd) {
    return [
      {
        ...annotation,
        spanStart: annotation.spanStart + delta,
        spanEnd: annotation.spanEnd + delta,
      },
    ];
  }

  const pieces: ReconciledAnnotationDetail[] = [];
  const leftEnd = Math.min(annotation.spanEnd, changeStart);
  if (annotation.spanStart < leftEnd) {
    pieces.push({
      id: annotation.id,
      source: annotation.source,
      spanStart: annotation.spanStart,
      spanEnd: leftEnd,
    });
  }

  const rightStart = Math.max(annotation.spanStart, oldChangeEnd);
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

function reconcileAnnotations(
  previousMarkdown: string,
  nextMarkdown: string,
  annotations: AuthorshipAnnotationItem[],
): ReconciledAnnotationDetail[] {
  if (previousMarkdown === nextMarkdown) {
    return annotations;
  }

  const diff = diffMarkdown(previousMarkdown, nextMarkdown);
  return annotations.flatMap((annotation) =>
    reconcileOneAnnotation(
      annotation,
      diff.changeStart,
      diff.oldChangeEnd,
      diff.insertedLength,
    ),
  );
}

export default function AuthorshipPlugin() {
  const [editor] = useLexicalComposerContext();
  const { annotations, fileId, onAnnotationsReconciled, onPasteRecorded } =
    useAuthorshipEditorContext();
  const pendingPasteRef = useRef<string | null>(null);
  const annotationsRef = useRef(annotations);
  const previousMarkdownRef = useRef<string | null>(null);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  useEffect(() => {
    if (!fileId) {
      previousMarkdownRef.current = null;
      return;
    }

    editor.getEditorState().read(() => {
      previousMarkdownRef.current = $convertToMarkdownString(markdownTransformers);
    });
  }, [editor, fileId]);

  useEffect(() => {
    if (!fileId) {
      return;
    }

    const unregisterCommand = editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const pastedText = readPastedText(event);
        if (pastedText) {
          pendingPasteRef.current = normalizeNewlines(pastedText);
        }

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    const unregisterListener = editor.registerUpdateListener(({ editorState, tags }) => {
      if (tags.has(NON_PERSISTENT_DECORATION_TAG)) {
        return;
      }

      editorState.read(() => {
        const markdown = $convertToMarkdownString(markdownTransformers);
        const previousMarkdown = previousMarkdownRef.current;
        previousMarkdownRef.current = markdown;

        if (previousMarkdown === null) {
          return;
        }

        const nextAnnotations = reconcileAnnotations(
          previousMarkdown,
          markdown,
          annotationsRef.current,
        );
        const shouldReconcile =
          annotationsRef.current.length > 0 &&
          JSON.stringify(nextAnnotations) !== JSON.stringify(annotationsRef.current);

        if (tags.has(PASTE_TAG) && pendingPasteRef.current) {
          const pastedText = pendingPasteRef.current;
          pendingPasteRef.current = null;
          const inserted =
            collectInsertedTextAfterPaste(pastedText) ?? pastedText.replace(/\n/g, '');
          const spans =
            resolvePasteSpanInMarkdown(markdown, pastedText) ??
            findLastMarkdownSpanRelaxed(normalizeNewlines(markdown), inserted);

          if (!spans) {
            return;
          }

          const recordPaste = () =>
            onPasteRecorded({
              id: crypto.randomUUID(),
              spanStart: spans.spanStart,
              spanEnd: spans.spanEnd,
              pastedText: inserted,
            });

          if (shouldReconcile) {
            void Promise.resolve(onAnnotationsReconciled(nextAnnotations))
              .then(recordPaste)
              .catch(() => undefined);
          } else {
            void Promise.resolve(recordPaste()).catch(() => undefined);
          }
          return;
        }

        if (shouldReconcile) {
          void Promise.resolve(onAnnotationsReconciled(nextAnnotations)).catch(
            () => undefined,
          );
        }
      });
    });

    return () => {
      unregisterCommand();
      unregisterListener();
    };
  }, [editor, fileId, onAnnotationsReconciled, onPasteRecorded]);

  return null;
}
