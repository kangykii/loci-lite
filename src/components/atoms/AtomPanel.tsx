import { useMemo } from 'react';
import type { AtomFilter } from '../../lib/atomLabels';
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
  filter: AtomFilter;
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
};

const EMPTY_MESSAGES: Record<AtomFilter, string> = {
  all: 'No bookmarks yet.',
  definition: 'No definitions yet.',
  note: 'No notes yet.',
  reminder: 'No reminders yet.',
};

export default function AtomPanel({
  atoms,
  filter,
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
}: AtomPanelProps) {
  const hasActiveSearch = searchQuery.trim().length > 0;

  const filteredGridItems = useMemo(() => {
    const items = buildBookmarkGridItems(atoms);

    const typeFiltered =
      filter === 'all'
        ? items
        : items.filter((item) => item.members.some((member) => member.type === filter));

    if (!hasActiveSearch) {
      return typeFiltered;
    }

    return typeFiltered.filter((item) =>
      item.members.some((member) => matchesSearch(member.sourceText, searchQuery)),
    );
  }, [atoms, filter, hasActiveSearch, searchQuery]);

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
          {hasActiveSearch ? 'No bookmarks match your search.' : EMPTY_MESSAGES[filter]}
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
