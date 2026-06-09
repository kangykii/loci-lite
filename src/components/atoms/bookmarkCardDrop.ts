import { useCallback, useState, type DragEvent } from 'react';

import { getActiveBrowseDragPayload } from '../../lib/browseDrag';
import { isBrowseDragTransfer, readDragPayload } from '../../lib/deletePayload';

type UseBookmarkCardDropOptions = {
  atomId: string;
  enabled?: boolean;
  onStackDrop?: (draggedId: string, targetId: string) => void;
};

function canStackDropOnCard(atomId: string): boolean {
  const active = getActiveBrowseDragPayload();
  return active?.kind === 'bookmark' && active.id !== atomId;
}

export function useBookmarkCardDrop({
  atomId,
  enabled = false,
  onStackDrop,
}: UseBookmarkCardDropOptions) {
  const [isStackDropTarget, setIsStackDropTarget] = useState(false);

  const canAcceptDrop = enabled && Boolean(onStackDrop);

  const onDragEnter = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!canAcceptDrop) {
        return;
      }

      if (!isBrowseDragTransfer(event.dataTransfer) || !canStackDropOnCard(atomId)) {
        return;
      }

      event.preventDefault();
      setIsStackDropTarget(true);
    },
    [atomId, canAcceptDrop],
  );

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsStackDropTarget(false);
    }
  }, []);

  const onDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!canAcceptDrop) {
        return;
      }

      if (!isBrowseDragTransfer(event.dataTransfer) || !canStackDropOnCard(atomId)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setIsStackDropTarget(true);
    },
    [atomId, canAcceptDrop],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsStackDropTarget(false);

      if (!canAcceptDrop) {
        return;
      }

      const payload = readDragPayload(event.dataTransfer);

      if (payload?.kind === 'bookmark' && payload.id !== atomId) {
        onStackDrop?.(payload.id, atomId);
      }
    },
    [atomId, canAcceptDrop, onStackDrop],
  );

  return {
    isStackDropTarget,
    dropHandlers: {
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
    },
  };
}
