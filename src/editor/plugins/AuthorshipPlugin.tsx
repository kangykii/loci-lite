import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $addUpdateTag,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $parseSerializedNode,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  PASTE_TAG,
  type PasteCommandType,
} from 'lexical';
import { useEffect, useRef } from 'react';
import { useAuthorshipEditorContext } from '../context/AuthorshipEditorContext';
import {
  buildAuthorshipDocIndex,
  getVisibleTextOffsetForPoint,
} from '../lib/authorshipIndex';
import {
  diffVisibleText,
  insertedVisibleTextRange,
  reconcileVisibleTextAnnotations,
} from '../lib/authorshipSpans';
import { NON_PERSISTENT_DECORATION_TAG } from '../lib/editorUpdateTags';
import { markdownPasteToSerializedNodes } from '../lib/smartMarkdownPaste';

type PasteIntent = {
  previousVisibleText: string;
  replaceStart: number;
  replaceEnd: number;
};

function readPastedText(event: PasteCommandType): string {
  return event instanceof ClipboardEvent
    ? event.clipboardData?.getData('text/plain') ?? ''
    : '';
}

function hasMeaningfulHtmlPaste(event: PasteCommandType): boolean {
  if (!(event instanceof ClipboardEvent)) {
    return false;
  }

  const html = event.clipboardData?.getData('text/html') ?? '';
  return html
    .replace(/<!--StartFragment-->|<!--EndFragment-->/g, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim().length > 0;
}

function currentVisibleSelectionRange(): { spanStart: number; spanEnd: number } | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }

  const anchor = getVisibleTextOffsetForPoint(selection.anchor);
  const focus = getVisibleTextOffsetForPoint(selection.focus);
  if (anchor === null || focus === null) {
    return null;
  }

  return {
    spanStart: Math.min(anchor, focus),
    spanEnd: Math.max(anchor, focus),
  };
}

function capturePasteIntent(): PasteIntent | null {
  const { docText } = buildAuthorshipDocIndex();
  const selectionRange = currentVisibleSelectionRange();
  if (!selectionRange) {
    return null;
  }

  return {
    previousVisibleText: docText,
    replaceStart: selectionRange.spanStart,
    replaceEnd: selectionRange.spanEnd,
  };
}

function anchoredPasteChange(
  intent: PasteIntent,
  nextVisibleText: string,
) {
  const removedLength = intent.replaceEnd - intent.replaceStart;
  return {
    changeStart: intent.replaceStart,
    oldChangeEnd: intent.replaceEnd,
    insertedLength: Math.max(
      0,
      nextVisibleText.length - intent.previousVisibleText.length + removedLength,
    ),
  };
}

export default function AuthorshipPlugin() {
  const [editor] = useLexicalComposerContext();
  const { annotations, fileId, onAnnotationsReconciled, onPasteRecorded } =
    useAuthorshipEditorContext();
  const annotationsRef = useRef(annotations);
  const previousVisibleTextRef = useRef<string | null>(null);
  const pasteIntentRef = useRef<PasteIntent | null>(null);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  useEffect(() => {
    if (!fileId) {
      previousVisibleTextRef.current = null;
      return;
    }

    editor.getEditorState().read(() => {
      previousVisibleTextRef.current = buildAuthorshipDocIndex().docText;
    });
  }, [editor, fileId]);

  useEffect(() => {
    if (!fileId) {
      return;
    }

    const unregisterCommand = editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        pasteIntentRef.current = capturePasteIntent();

        if (hasMeaningfulHtmlPaste(event)) {
          return false;
        }

        const pastedText = readPastedText(event);
        if (!pastedText) {
          return false;
        }

        const parsedNodes = markdownPasteToSerializedNodes(pastedText);
        if (parsedNodes) {
          event.preventDefault();
          $addUpdateTag(PASTE_TAG);
          const nodes = parsedNodes.map((node) => $parseSerializedNode(node));
          $insertNodes(nodes);
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );

    const unregisterListener = editor.registerUpdateListener(({ editorState, tags }) => {
      if (tags.has(NON_PERSISTENT_DECORATION_TAG)) {
        return;
      }

      editorState.read(() => {
        const visibleText = buildAuthorshipDocIndex().docText;
        const pasteIntent = tags.has(PASTE_TAG) ? pasteIntentRef.current : null;
        const previousVisibleText =
          pasteIntent?.previousVisibleText ?? previousVisibleTextRef.current;
        previousVisibleTextRef.current = visibleText;

        if (previousVisibleText === null) {
          pasteIntentRef.current = null;
          return;
        }

        const change = pasteIntent
          ? anchoredPasteChange(pasteIntent, visibleText)
          : diffVisibleText(previousVisibleText, visibleText);
        const nextAnnotations = reconcileVisibleTextAnnotations(change, annotationsRef.current);
        const shouldReconcile =
          annotationsRef.current.length > 0 &&
          JSON.stringify(nextAnnotations) !== JSON.stringify(annotationsRef.current);

        if (tags.has(PASTE_TAG)) {
          const insertedRange = insertedVisibleTextRange(change);
          pasteIntentRef.current = null;

          const recordPaste = () =>
            insertedRange
              ? onPasteRecorded({
                  id: crypto.randomUUID(),
                  spanStart: insertedRange.spanStart,
                  spanEnd: insertedRange.spanEnd,
                  pastedText: visibleText.slice(insertedRange.spanStart, insertedRange.spanEnd),
                })
              : undefined;

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
          void Promise.resolve(onAnnotationsReconciled(nextAnnotations)).catch(() => undefined);
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
