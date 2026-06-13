import { useMemo, type MouseEvent } from 'react';
import {
  buildBookmarkGridItems,
  resolveStackDisplayName,
  type BookmarkGridItem,
} from '../../lib/bookmarkStacks';
import type { AtomRecord } from '../../lib/atomTypes';
import { matchesSearch } from '../../lib/searchMatch';
import AtomCard from './AtomCard';
import BookmarkStackFolder from './BookmarkStackFolder';

type AtomPanelProps = {
  atoms: AtomRecord[];
  searchQuery: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  documentTitles: Record<string, string>;
  stackDisplayNames: Record<string, string>;
  draggable?: boolean;
  onRequestEdit: (id: string) => void;
  onRenameStack: (groupLabel: string, name: string) => void;
  onStackDrop?: (draggedId: string, targetId: string) => void;
  onOpenStack?: (item: BookmarkGridItem) => void;
  onContextMenuAtom?: (event: MouseEvent, atom: AtomRecord) => void;
  onContextMenuStack?: (
    event: MouseEvent,
    item: BookmarkGridItem,
    displayName: string,
  ) => void;
};

export default function AtomPanel({
  atoms,
  searchQuery,
  status,
  error,
  documentTitles,
  stackDisplayNames,
  draggable = false,
  onRequestEdit,
  onRenameStack,
  onStackDrop,
  onOpenStack,
  onContextMenuAtom,
  onContextMenuStack,
}: AtomPanelProps) {
  const hasActiveSearch = searchQuery.trim().length > 0;

  const filteredGridItems = useMemo(() => {
    const items = buildBookmarkGridItems(atoms);

    if (!hasActiveSearch) {
      return items;
    }

    return items.filter((item) =>
      item.members.some((member) => matchesSearch(member.sourceText, searchQuery)),
    );
  }, [atoms, hasActiveSearch, searchQuery]);

  return (
    <section aria-label="Bookmark list" className="atom-panel">
      {status === 'loading' ? <p className="atom-list-status">Loading bookmarks…</p> : null}
      {error ? (
        <p className="atom-list-status atom-list-error" role="alert">
          {error}
        </p>
      ) : null}
      {status === 'ready' && filteredGridItems.length === 0 ? (
        <p className="atom-list-empty">
          {hasActiveSearch ? 'No definitions match your search.' : 'No definitions yet.'}
        </p>
      ) : null}
      {status === 'ready' && filteredGridItems.length > 0 ? (
        <div className="bookmark-flashcard-grid">
          {filteredGridItems.map((item) => {
            const key = item.representative.groupLabel ?? item.representative.id;

            if (item.stackCount >= 2 && item.representative.groupLabel && onOpenStack) {
              const displayName = resolveStackDisplayName(
                stackDisplayNames[item.representative.groupLabel],
              );

              return (
                <BookmarkStackFolder
                  displayName={displayName}
                  draggable={draggable}
                  item={item}
                  key={key}
                  onContextMenu={onContextMenuStack}
                  onOpenStack={() => onOpenStack(item)}
                  onRenameStack={onRenameStack}
                  onStackDrop={onStackDrop}
                />
              );
            }

            return (
              <AtomCard
                atom={item.representative}
                documentTitle={documentTitles[item.representative.fileId] ?? 'Untitled'}
                draggable={draggable}
                key={key}
                onContextMenu={onContextMenuAtom}
                onRequestEdit={onRequestEdit}
                onStackDrop={onStackDrop}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
