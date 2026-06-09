import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AuthorshipAnnotationItem,
  AuthorshipEditorContextValue,
  MarkAsMineDetail,
  PasteRecordedDetail,
  ReconciledAnnotationDetail,
} from '../editor/context/AuthorshipEditorContext';
import { isTauri } from '../lib/tauri';
import {
  createAnnotation,
  listAnnotationsForFile,
  replaceAnnotationsForFile,
  subtractAnnotationRange,
  type AnnotationRecord,
} from '../store/annotations.store';
import { initDb } from '../store/db';

function toAnnotationItem(record: AnnotationRecord): AuthorshipAnnotationItem {
  return {
    id: record.id,
    fileId: record.fileId,
    spanStart: record.spanStart,
    spanEnd: record.spanEnd,
    source: record.source,
    createdAt: record.createdAt,
  };
}

export function useEditorAuthorshipBridge(fileId: string) {
  const [annotations, setAnnotations] = useState<AuthorshipAnnotationItem[]>([]);

  const loadAnnotations = useCallback(async () => {
    if (!isTauri() || !fileId) {
      setAnnotations([]);
      return;
    }

    await initDb();
    const rows = await listAnnotationsForFile(fileId);
    setAnnotations(rows.map(toAnnotationItem));
  }, [fileId]);

  useEffect(() => {
    void loadAnnotations();
  }, [loadAnnotations]);

  const onPasteRecorded = useCallback(
    async (detail: PasteRecordedDetail) => {
      if (!fileId) {
        return;
      }

      const record: Omit<AnnotationRecord, 'createdAt'> = {
        id: detail.id,
        fileId,
        spanStart: detail.spanStart,
        spanEnd: detail.spanEnd,
        source: 'paste',
      };

      await createAnnotation(record);
      setAnnotations((current) => [
        ...current,
        {
          ...record,
          createdAt: Date.now(),
        },
      ]);
    },
    [fileId],
  );

  const onMarkAsMine = useCallback(async (detail: MarkAsMineDetail) => {
    const replacements = await subtractAnnotationRange(
      detail.annotationId,
      detail.spanStart,
      detail.spanEnd,
    );
    setAnnotations((current) =>
      [
        ...current.filter((entry) => entry.id !== detail.annotationId),
        ...replacements.map(toAnnotationItem),
      ].sort((left, right) => left.spanStart - right.spanStart),
    );
  }, []);

  const onAnnotationsReconciled = useCallback(
    async (nextAnnotations: ReconciledAnnotationDetail[]) => {
      if (!fileId) {
        return;
      }

      const records = await replaceAnnotationsForFile(fileId, nextAnnotations);
      setAnnotations(records.map(toAnnotationItem));
    },
    [fileId],
  );

  const authorshipEditor = useMemo<AuthorshipEditorContextValue>(
    () => ({
      fileId,
      annotations,
      authorshipVisible: false,
      onPasteRecorded,
      onMarkAsMine,
      onAnnotationsReconciled,
    }),
    [annotations, fileId, onAnnotationsReconciled, onMarkAsMine, onPasteRecorded],
  );

  return {
    authorshipEditor,
    reloadAnnotations: loadAnnotations,
  };
}
