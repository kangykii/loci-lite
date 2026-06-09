import { useCallback, useEffect, useMemo, useState } from 'react';

import AtomPanel from '../components/atoms/AtomPanel';
import AtomPopup from '../components/atoms/AtomPopup';
import BookmarkFilterMenu from '../components/atoms/BookmarkFilterMenu';
import BookmarkStackPopup from '../components/atoms/BookmarkStackPopup';
import BrowseDeleteBin from '../components/ui/BrowseDeleteBin';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SearchField from '../components/ui/SearchField';
import { useAtoms } from '../hooks/useAtoms';
import { useNotifications } from '../hooks/useNotifications';
import { useBookmarkStacks } from '../hooks/useBookmarkStacks';
import { useDocumentTitles } from '../hooks/useDocumentTitles';
import { useStackDisplayNames } from '../hooks/useStackDisplayNames';
import type { AtomFilter } from '../lib/atomLabels';
import type { AtomRecord } from '../lib/atomTypes';
import {
  buildBookmarkGridItems,
  resolveStackDisplayName,
  type BookmarkGridItem,
} from '../lib/bookmarkStacks';
import { isTauri } from '../lib/tauri';

type AtomsViewProps = {
  activeFileId: string | null;
  listRefreshKey?: number;
};

type PendingBookmarkDelete = {
  id: string;
  sourceText: string;
};

export default function AtomsView({ listRefreshKey }: AtomsViewProps) {
  const { notifyBookmark } = useNotifications();
  const canDelete = isTauri();
  const [filter, setFilter] = useState<AtomFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PendingBookmarkDelete | null>(null);
  const [editingAtom, setEditingAtom] = useState<AtomRecord | null>(null);
  const [openStack, setOpenStack] = useState<BookmarkGridItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const { atoms, status, error, loadAll, removeAtom, updateAtom } = useAtoms();

  const fileIds = useMemo(() => atoms.map((atom) => atom.fileId), [atoms]);
  const documentTitles = useDocumentTitles(fileIds);

  const stackGroupLabels = useMemo(
    () =>
      [
        ...new Set(
          atoms
            .map((atom) => atom.groupLabel)
            .filter((groupLabel): groupLabel is string => groupLabel !== null),
        ),
      ],
    [atoms],
  );

  const { names: stackDisplayNames, renameStack } = useStackDisplayNames(stackGroupLabels);

  const { stackBookmarks } = useBookmarkStacks({
    atoms,
    onStacked: loadAll,
  });

  useEffect(() => {
    if (!isTauri()) {
      return;
    }

    void loadAll();
  }, [listRefreshKey, loadAll]);

  useEffect(() => {
    setOpenStack((current) => {
      if (!current?.representative.groupLabel) {
        return null;
      }

      const updated = buildBookmarkGridItems(atoms).find(
        (item) => item.representative.groupLabel === current.representative.groupLabel,
      );

      if (!updated || updated.stackCount < 2) {
        return null;
      }

      return updated;
    });
  }, [atoms]);

  const openDeleteConfirm = useCallback((id: string, sourceText: string) => {
    setDeleteError(null);
    setPendingDelete({ id, sourceText });
  }, []);

  const openEdit = useCallback(
    (atomId: string) => {
      const atom = atoms.find((entry) => entry.id === atomId);

      if (!atom) {
        return;
      }

      setUpdateError(null);
      setEditingAtom(atom);
    },
    [atoms],
  );

  const handleUpdateAtom = useCallback(
    (id: string, payload: { type: AtomRecord['type']; content: string; sourceText: string }) => {
      setIsUpdating(true);
      setUpdateError(null);

      void updateAtom(id, {
        type: payload.type,
        answer: payload.content,
        sourceText: payload.sourceText,
      })
        .then(() => {
          setEditingAtom(null);
          notifyBookmark();
          void loadAll();
        })
        .catch((cause: unknown) => {
          const message = cause instanceof Error ? cause.message : 'Failed to update bookmark';
          setUpdateError(message);
        })
        .finally(() => {
          setIsUpdating(false);
        });
    },
    [loadAll, notifyBookmark, updateAtom],
  );

  const handleDropOnBin = useCallback(
    (atomId: string) => {
      const atom = atoms.find((entry) => entry.id === atomId);

      if (!atom) {
        return;
      }

      openDeleteConfirm(atom.id, atom.sourceText);
    },
    [atoms, openDeleteConfirm],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDelete) {
      return;
    }

    setIsRemoving(true);
    setDeleteError(null);

    void removeAtom(pendingDelete.id)
      .then(() => {
        setPendingDelete(null);
        void loadAll();
      })
      .catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : 'Failed to delete bookmark';
        setDeleteError(message);
      })
      .finally(() => {
        setIsRemoving(false);
      });
  }, [loadAll, pendingDelete, removeAtom]);

  const handleStackDrop = useCallback(
    (draggedId: string, targetId: string) => {
      void stackBookmarks(draggedId, targetId);
    },
    [stackBookmarks],
  );

  return (
    <main className="app-shell atoms-view">
      <section className="atoms-stack" aria-label="Bookmarks">
        <div className="atoms-controls">
          <SearchField
            aria-label="Bookmark search"
            onChange={setSearchQuery}
            placeholder="Bookmark search..."
            value={searchQuery}
          />
          <BookmarkFilterMenu filter={filter} onFilterChange={setFilter} />
          <BrowseDeleteBin
            acceptKind="bookmark"
            disabled={!canDelete}
            onDrop={handleDropOnBin}
          />
        </div>

        {!isTauri() ? (
          <p className="atom-list-status desktop-only-hint" role="status">
            Open the Loci Notepad desktop app to browse bookmarks.
          </p>
        ) : null}

        <AtomPanel
          atoms={atoms}
          documentTitles={documentTitles}
          draggable={canDelete}
          error={error}
          filter={filter}
          onOpenStack={setOpenStack}
          onRenameStack={(groupLabel, name) => {
            void renameStack(groupLabel, name);
          }}
          onRequestEdit={openEdit}
          onStackDrop={canDelete ? handleStackDrop : undefined}
          searchQuery={searchQuery}
          stackDisplayNames={stackDisplayNames}
          status={status}
        />
      </section>

      {openStack && openStack.representative.groupLabel ? (
        <BookmarkStackPopup
          documentTitles={documentTitles}
          folderName={resolveStackDisplayName(
            stackDisplayNames[openStack.representative.groupLabel],
          )}
          groupLabel={openStack.representative.groupLabel}
          members={openStack.members}
          onClose={() => setOpenStack(null)}
          onRenameStack={(groupLabel, name) => {
            void renameStack(groupLabel, name);
          }}
          onRequestEdit={openEdit}
        />
      ) : null}

      {editingAtom ? (
        <AtomPopup
          headerLabel="Bookmark"
          initialContent={editingAtom.answer}
          initialType={editingAtom.type}
          isSaving={isUpdating}
          mode="edit"
          onClose={() => {
            setUpdateError(null);
            setEditingAtom(null);
          }}
          onSave={(payload) => handleUpdateAtom(editingAtom.id, payload)}
          saveLabel="Save changes"
          selectedText={editingAtom.sourceText}
        />
      ) : null}

      {updateError ? (
        <p className="atom-list-status atom-list-error" role="alert">
          {updateError}
        </p>
      ) : null}

      <ConfirmDialog
        error={deleteError}
        isConfirming={isRemoving}
        isOpen={pendingDelete !== null}
        message={
          pendingDelete
            ? `Delete “${pendingDelete.sourceText}”? This removes the bookmark only — highlighted text in the note is unchanged.`
            : ''
        }
        onCancel={() => {
          setDeleteError(null);
          setPendingDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete bookmark?"
      />
    </main>
  );
}
