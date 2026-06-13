import { useRef, type KeyboardEvent, type MouseEvent } from 'react';

import {
  consumeBrowseDragClick,
  endBrowseDrag,
  startBrowseDrag,
} from '../../lib/browseDrag';
import type { BookmarkGridItem } from '../../lib/bookmarkStacks';
import { useBookmarkCardDrop } from './bookmarkCardDrop';
import BookmarkStackNameEditor from './BookmarkStackNameEditor';

type BookmarkStackFolderProps = {
  item: BookmarkGridItem;
  displayName: string;
  draggable?: boolean;
  onOpenStack: () => void;
  onContextMenu?: (event: MouseEvent, item: BookmarkGridItem, displayName: string) => void;
  onRenameStack: (groupLabel: string, name: string) => void;
  onStackDrop?: (draggedId: string, targetId: string) => void;
};

const MAX_VISIBLE_FRINGES = 2;

export default function BookmarkStackFolder({
  item,
  displayName,
  draggable = false,
  onOpenStack,
  onContextMenu,
  onRenameStack,
  onStackDrop,
}: BookmarkStackFolderProps) {
  const groupLabel = item.representative.groupLabel;
  const isRenamingRef = useRef(false);
  const suppressNextOpenRef = useRef(false);
  const fringeCount = Math.min(item.stackCount, MAX_VISIBLE_FRINGES);

  const { isStackDropTarget, dropHandlers } = useBookmarkCardDrop({
    atomId: item.representative.id,
    enabled: draggable,
    onStackDrop,
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isRenamingRef.current) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenStack();
    }
  };

  const bookmarkLabel =
    item.stackCount === 1 ? '1 bookmark' : `${item.stackCount} bookmarks`;

  return (
    <article
      aria-label={`${displayName}, ${bookmarkLabel}`}
      className={`bookmark-stack-folder ${isStackDropTarget ? 'is-stack-drop-target' : ''}`}
      draggable={draggable}
      onClick={() => {
        if (isRenamingRef.current) {
          return;
        }

        if (consumeBrowseDragClick()) {
          return;
        }

        if (suppressNextOpenRef.current) {
          suppressNextOpenRef.current = false;
          return;
        }

        onOpenStack();
      }}
      onContextMenu={(event) => onContextMenu?.(event, item, displayName)}
      onDragEnd={endBrowseDrag}
      onDragStart={
        draggable
          ? (event) => {
              startBrowseDrag(
                event,
                { kind: 'bookmark', id: item.representative.id },
                {
                  primary: displayName,
                  secondary: bookmarkLabel,
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
      <div className="bookmark-stack-folder-body">
        <div className="bookmark-stack-folder-pocket">
          <div aria-hidden="true" className="bookmark-stack-folder-fringes">
            {Array.from({ length: fringeCount }, (_, index) => (
              <span
                className="bookmark-stack-folder-fringe"
                data-layer={index}
                key={index}
              />
            ))}
          </div>
          <div
            className="bookmark-stack-folder-label"
            onClick={(event) => event.stopPropagation()}
          >
            {groupLabel ? (
              <BookmarkStackNameEditor
                displayName={displayName}
                onRename={(name) => onRenameStack(groupLabel, name)}
                onRenameEnd={() => {
                  isRenamingRef.current = false;
                }}
                onRenameStart={() => {
                  isRenamingRef.current = true;
                  suppressNextOpenRef.current = true;
                }}
                variant="grid"
              />
            ) : null}
            <span aria-hidden="true" className="bookmark-stack-folder-count">
              {item.stackCount}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
