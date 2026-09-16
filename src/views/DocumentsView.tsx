import { useCallback, useEffect, useMemo, useState } from 'react';
import DocumentRowSkeleton from '../components/documents/DocumentRowSkeleton';
import DocumentFilterMenu from '../components/documents/DocumentFilterMenu';
import DocumentsProjectList from '../components/documents/DocumentsProjectList';
import DocumentsStatus from '../components/documents/DocumentsStatus';
import BrowseDeleteBin from '../components/ui/BrowseDeleteBin';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SearchField from '../components/ui/SearchField';
import { useDelayedFlag } from '../hooks/useDelayedFlag';
import { useDeleteDocument } from '../hooks/useDeleteDocument';
import { useDocumentContextMenu } from '../hooks/useDocumentContextMenu';
import { useDocumentProjectFolders } from '../hooks/useDocumentProjectFolders';
import { useSearchableDocuments } from '../hooks/useSearchableDocuments';
import { matchesSearch } from '../lib/searchMatch';
import { isTauri } from '../lib/tauri';

type DocumentsViewProps = {
  onOpenEditor: (fileId: string) => void;
  onCreateNote: () => void;
  onDocumentDeleted: (fileId: string) => void;
  isCreating?: boolean;
  createError?: string | null;
  listRefreshKey?: number;
};

type PendingDocumentDelete = {
  id: string;
  title: string;
};

export default function DocumentsView({
  onOpenEditor,
  onCreateNote,
  onDocumentDeleted,
  isCreating,
  createError,
  listRefreshKey,
}: DocumentsViewProps) {
  const canCreate = isTauri();
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'pinned' | 'projects' | 'loose'>('all');
  const [sort, setSort] = useState<'recent' | 'title'>('recent');
  const [pendingDelete, setPendingDelete] = useState<PendingDocumentDelete | null>(null);
  const { documents, status, refresh } = useSearchableDocuments();
  const showLoadingSkeleton = useDelayedFlag(status === 'loading');
  const { remove, isDeleting, error: deleteError, clearError } = useDeleteDocument();
  const { dissolveProject, groupDocuments, removeDocumentFromProject } =
    useDocumentProjectFolders({ documents, onChanged: refresh });
  const documentMenu = useDocumentContextMenu({
    onChanged: refresh,
    onDeleted: onDocumentDeleted,
    onOpenDocument: onOpenEditor,
  });
  const hasActiveSearch = searchQuery.trim().length > 0;
  const visibleDocuments = useMemo(() => {
    const filtered = documents.filter((document) => {
      if (hasActiveSearch && !matchesSearch(document.haystack, searchQuery)) return false;
      if (scope === 'pinned') return document.pinned;
      if (scope === 'projects') return Boolean(document.projectGroupLabel);
      if (scope === 'loose') return !document.projectGroupLabel;
      return true;
    });

    return sort === 'title' ? [...filtered].sort((left, right) => left.title.localeCompare(right.title)) : filtered;
  }, [documents, hasActiveSearch, scope, searchQuery, sort]);

  useEffect(() => {
    void refresh();
  }, [refresh, listRefreshKey]);

  const handleDropOnBin = useCallback(
    (fileId: string) => {
      const document = documents.find((entry) => entry.id === fileId);
      if (!document) return;
      clearError();
      setPendingDelete({ id: document.id, title: document.title });
    },
    [clearError, documents],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    void remove(pendingDelete.id)
      .then(() => {
        onDocumentDeleted(pendingDelete.id);
        setPendingDelete(null);
        void refresh();
      })
      .catch(() => undefined);
  }, [onDocumentDeleted, pendingDelete, refresh, remove]);

  return (
    <main className="app-shell documents-view">
      <section className="documents-stack" aria-label="Documents">
        <header className="library-header">
          <h1>Library</h1>
          <button className="library-new-note" disabled={!canCreate || isCreating} onClick={onCreateNote} type="button">
            + Note
          </button>
        </header>
        <div className="documents-controls">
          <SearchField
            aria-label="Global search"
            onChange={setSearchQuery}
            placeholder="Global search..."
            value={searchQuery}
          />
          <DocumentFilterMenu onScopeChange={setScope} onSortChange={setSort} scope={scope} sort={sort} />
          <BrowseDeleteBin acceptKind="document" disabled={!canCreate} onDrop={handleDropOnBin} />
        </div>
        <DocumentsStatus
          canCreate={canCreate}
          createError={createError}
          documentsCount={documents.length}
          hasActiveSearch={hasActiveSearch}
          status={status}
          visibleCount={visibleDocuments.length}
        />
        {showLoadingSkeleton ? (
          <div className="documents-list">
            {[0, 1, 2, 3].map((index) => (
              <DocumentRowSkeleton index={index} key={index} />
            ))}
          </div>
        ) : status === 'loading' ? null : (
          // DocumentsProjectRows always renders its create-card alongside the
          // list — skip mounting it during the (sub-buffer) loading window so
          // it doesn't flash alone before real rows land next to it.
          <DocumentsProjectList
            canCreate={canCreate}
            documents={visibleDocuments}
            isCreating={isCreating}
            onContextMenu={documentMenu.openMenu}
            onCreateNote={onCreateNote}
            onDissolveProject={(memberIds, groupLabel) => void dissolveProject(memberIds, groupLabel)}
            onOpenEditor={onOpenEditor}
            onProjectDrop={(draggedId, targetId) => void groupDocuments(draggedId, targetId)}
            onRemoveFromProject={(fileId) => void removeDocumentFromProject(fileId)}
            searchQuery={searchQuery}
          />
        )}
      </section>
      <ConfirmDialog
        error={deleteError}
        isConfirming={isDeleting}
        isOpen={pendingDelete !== null}
        message={pendingDelete ? `Delete "${pendingDelete.title}"? This permanently removes the note and all bookmarks in it.` : ''}
        onCancel={() => {
          clearError();
          setPendingDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete note?"
      />
      {documentMenu.element}
    </main>
  );
}
