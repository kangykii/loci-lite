import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import { ChevronRight, FileText, ListFilter, Plus } from 'lucide-react';

import BrowseDeleteBin from '../components/ui/BrowseDeleteBin';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import SearchField from '../components/ui/SearchField';

import { useDeleteDocument } from '../hooks/useDeleteDocument';

import { useDocumentContextMenu } from '../hooks/useDocumentContextMenu';

import { useSearchableDocuments } from '../hooks/useSearchableDocuments';
import { useSearchStagger } from '../hooks/useSearchStagger';

import {

  consumeBrowseDragClick,

  endBrowseDrag,

  startBrowseDrag,

} from '../lib/browseDrag';

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

  const documentMenu = useDocumentContextMenu({
    onChanged: refresh,
    onDeleted: onDocumentDeleted,
    onOpenDocument: onOpenEditor,
  });



  const hasActiveSearch = searchQuery.trim().length > 0;



  const visibleDocuments = useMemo(() => {

    if (!hasActiveSearch) {

      return documents;

    }



    return documents.filter((document) => matchesSearch(document.haystack, searchQuery));

  }, [documents, hasActiveSearch, searchQuery]);

  const { displayedItems: staggeredDocuments, isLeaving: listStaggerLeaving } = useSearchStagger(
    searchQuery,
    visibleDocuments,
  );

  useEffect(() => {

    void refresh();

  }, [refresh, listRefreshKey]);



  const handleDropOnBin = useCallback(

    (fileId: string) => {

      const document = documents.find((entry) => entry.id === fileId);



      if (!document) {

        return;

      }



      clearError();

      setPendingDelete({ id: document.id, title: document.title });

    },

    [clearError, documents],

  );



  const handleConfirmDelete = useCallback(() => {

    if (!pendingDelete) {

      return;

    }



    void remove(pendingDelete.id)

      .then(() => {

        onDocumentDeleted(pendingDelete.id);

        setPendingDelete(null);

        void refresh();

      })

      .catch(() => {

        // deleteError surfaces in the dialog.

      });

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

          <BrowseDeleteBin

            acceptKind="document"

            disabled={!canCreate}

            onDrop={handleDropOnBin}

          />

        </div>

        {status === 'loading' ? (

          <p className="library-status">Loading documents…</p>

        ) : null}

        {!canCreate ? (

          <p className="library-status desktop-only-hint" role="status">

            Open the Loci Notepad desktop app (<code>corepack pnpm tauri dev</code>) to create notes.

          </p>

        ) : null}

        {createError ? (

          <p className="library-status create-error" role="alert">

            Could not create note: {createError}

          </p>

        ) : null}

        {status === 'ready' && documents.length === 0 ? (

          <p className="library-status">No documents yet.</p>

        ) : null}

        {status === 'ready' && documents.length > 0 && hasActiveSearch && visibleDocuments.length === 0 ? (

          <p className="library-status">No documents match your search.</p>

        ) : null}

        <div className={`documents-list${listStaggerLeaving ? ' leaving' : ''}`} data-stagger>

          {staggeredDocuments.map((document, index) => (

            <div

              aria-label={`Open ${document.title}`}

              className="document-row"

              draggable={canCreate}

              key={document.id}

              style={{ '--stagger-index': index } as CSSProperties}

              onClick={() => {

                if (consumeBrowseDragClick()) {

                  return;

                }



                onOpenEditor(document.id);

              }}

              onContextMenu={(event) => documentMenu.openMenu(event, document)}

              onDragEnd={endBrowseDrag}

              onDragStart={(event) => {

                startBrowseDrag(

                  event,

                  { kind: 'document', id: document.id },

                  { primary: document.title, secondary: 'Note' },

                );

              }}

              onKeyDown={(event) => {

                if (event.key === 'Enter' || event.key === ' ') {

                  event.preventDefault();

                  onOpenEditor(document.id);

                }

              }}

              role="button"

              tabIndex={0}

            >

              <span className="document-icon">

                <FileText size={16} strokeWidth={1.5} />

              </span>

              <span className="document-copy">

                <strong>{document.title}</strong>

                <span>{document.meta}</span>

              </span>

              <ChevronRight size={16} strokeWidth={1.5} />

            </div>

          ))}

          <button

            className="creation-card document-create-card"

            disabled={!canCreate || isCreating}

            onClick={onCreateNote}

            type="button"

          >

            <span className="creation-badge">

              <Plus size={16} strokeWidth={1.5} />

            </span>

            <span className="creation-copy">

              <strong>{isCreating ? 'Creating…' : 'Add a new document'}</strong>

              <span>Start from a blank note</span>

            </span>

          </button>

        </div>

      </section>

      <ConfirmDialog

        error={deleteError}

        isConfirming={isDeleting}

        isOpen={pendingDelete !== null}

        message={

          pendingDelete

            ? `Delete “${pendingDelete.title}”? This permanently removes the note and all bookmarks in it.`

            : ''

        }

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


