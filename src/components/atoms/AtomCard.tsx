import { useState, type KeyboardEvent, type MouseEvent } from 'react';

import { ATOM_TYPE_LABELS } from '../../lib/atomLabels';
import {
  consumeBrowseDragClick,
  endBrowseDrag,
  startBrowseDrag,
} from '../../lib/browseDrag';
import type { AtomRecord } from '../../lib/atomTypes';
import { useBookmarkCardDrop } from './bookmarkCardDrop';
import BookmarkFlashcardFaces from './BookmarkFlashcardFaces';

type AtomCardProps = {
  atom: AtomRecord;
  documentTitle: string;
  draggable?: boolean;
  onRequestEdit: (id: string) => void;
  onContextMenu?: (event: MouseEvent, atom: AtomRecord) => void;
  onStackDrop?: (draggedId: string, targetId: string) => void;
};

export default function AtomCard({
  atom,
  documentTitle,
  draggable = false,
  onRequestEdit,
  onContextMenu,
  onStackDrop,
}: AtomCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const { isStackDropTarget, dropHandlers } = useBookmarkCardDrop({
    atomId: atom.id,
    enabled: draggable,
    onStackDrop,
  });

  const toggleFlip = () => {
    setIsFlipped((current) => !current);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFlip();
    }
  };

  return (
    <article
      aria-label={`${ATOM_TYPE_LABELS[atom.type]} bookmark`}
      aria-pressed={isFlipped}
      className={`bookmark-flashcard ${isFlipped ? 'is-flipped' : ''} ${
        isStackDropTarget ? 'is-stack-drop-target' : ''
      }`}
      draggable={draggable}
      onClick={() => {
        if (consumeBrowseDragClick()) {
          return;
        }

        toggleFlip();
      }}
      onContextMenu={(event) => onContextMenu?.(event, atom)}
      onDragEnd={endBrowseDrag}
      onDragStart={
        draggable
          ? (event) => {
              startBrowseDrag(
                event,
                { kind: 'bookmark', id: atom.id },
                {
                  primary: atom.sourceText,
                  secondary: `${ATOM_TYPE_LABELS[atom.type]} · ${documentTitle}`,
                },
              );
            }
          : undefined
      }
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      {...dropHandlers}
    >
      <BookmarkFlashcardFaces
        atom={atom}
        documentTitle={documentTitle}
        onRequestEdit={(id) => {
          setIsFlipped(false);
          onRequestEdit(id);
        }}
      />
    </article>
  );
}
