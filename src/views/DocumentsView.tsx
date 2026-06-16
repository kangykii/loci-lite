import { useCallback, useEffect, useMemo, useState } from 'react';
import { ListFilter } from 'lucide-react';
import DocumentsProjectList from '../components/documents/DocumentsProjectList';
import DocumentsStatus from '../components/documents/DocumentsStatus';
import BrowseDeleteBin from '../components/ui/BrowseDeleteBin';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SearchField from '../components/ui/SearchField';
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
  const [pendingDelete, setPendingDelete] = useState<PendingDocumentDelete | null>(null);
  const { documents, status, refresh } = useSearchableDocuments();
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
    if (!hasActiveSearch) return documents;
    return documents.filter((document) => matchesSearch(document.haystack, searchQuery));
  }, [documents, hasActiveSearch, searchQuery]);

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
        <div className="documents-controls">
          <SearchField
            aria-label="Global search"
            onChange={setSearchQuery}
            placeholder="Global search..."
            value={searchQuery}
          />
          <button className="documents-filter" disabled type="button">
            <ListFilter size={15} strokeWidth={1.5} />
            Filter
          </button>
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
        <DocumentsProjectList
          canCreate={canCreate}
          documents={documents}
          isCreating={isCreating}
          onContextMenu={documentMenu.openMenu}
          onCreateNote={onCreateNote}
          onDissolveProject={(memberIds, groupLabel) => void dissolveProject(memberIds, groupLabel)}
          onOpenEditor={onOpenEditor}
          onProjectDrop={(draggedId, targetId) => void groupDocuments(draggedId, targetId)}
          onRemoveFromProject={(fileId) => void removeDocumentFromProject(fileId)}
          searchQuery={searchQuery}
        />
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
