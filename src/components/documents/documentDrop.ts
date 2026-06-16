import { useCallback, useState, type DragEvent } from 'react';
import { getActiveBrowseDragPayload } from '../../lib/browseDrag';
import { isBrowseDragTransfer, readDragPayload } from '../../lib/deletePayload';

type UseDocumentDropOptions = {
  enabled?: boolean;
  onProjectDrop?: (draggedId: string, targetId: string) => void;
  targetId: string;
};

function canDropOnDocument(targetId: string): boolean {
  const active = getActiveBrowseDragPayload();
  return active?.kind === 'document' && active.id !== targetId;
}

export function useDocumentDrop({
  enabled = false,
  onProjectDrop,
  targetId,
}: UseDocumentDropOptions) {
  const [isProjectDropTarget, setIsProjectDropTarget] = useState(false);
  const canAcceptDrop = enabled && Boolean(onProjectDrop);

  const onDragEnter = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!canAcceptDrop) return;
      if (!isBrowseDragTransfer(event.dataTransfer) || !canDropOnDocument(targetId)) return;

      event.preventDefault();
      setIsProjectDropTarget(true);
    },
    [canAcceptDrop, targetId],
  );

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsProjectDropTarget(false);
    }
  }, []);

  const onDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!canAcceptDrop) return;
      if (!isBrowseDragTransfer(event.dataTransfer) || !canDropOnDocument(targetId)) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setIsProjectDropTarget(true);
    },
    [canAcceptDrop, targetId],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsProjectDropTarget(false);

      if (!canAcceptDrop) return;

      const payload = readDragPayload(event.dataTransfer);
      if (payload?.kind === 'document' && payload.id !== targetId) {
        onProjectDrop?.(payload.id, targetId);
      }
    },
    [canAcceptDrop, onProjectDrop, targetId],
  );

  return {
    dropHandlers: { onDragEnter, onDragLeave, onDragOver, onDrop },
    isProjectDropTarget,
  };
}
