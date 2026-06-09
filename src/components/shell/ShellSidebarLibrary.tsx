import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChevronRight } from 'lucide-react';
import SearchField from '../ui/SearchField';
import { useSearchableDocuments } from '../../hooks/useSearchableDocuments';
import { useSearchStagger } from '../../hooks/useSearchStagger';
import { matchesSearch } from '../../lib/searchMatch';
import { isTauri } from '../../lib/tauri';

type ShellSidebarLibraryProps = {
  isOpen: boolean;
  listRefreshKey: number;
  onOpenDocument: (fileId: string) => void;
  onOpenDocumentsPage: () => void;
};

export default function ShellSidebarLibrary({
  isOpen,
  listRefreshKey,
  onOpenDocument,
  onOpenDocumentsPage,
}: ShellSidebarLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);
  const { documents, status, error, refresh } = useSearchableDocuments();
  const hasActiveSearch = searchQuery.trim().length > 0;

  useEffect(() => {
    if (isOpen) {
      void refresh();
    }
  }, [isOpen, listRefreshKey, refresh]);

  const visibleDocuments = useMemo(() => {
    if (!hasActiveSearch) {
      return documents;
    }

    return documents.filter((document) => matchesSearch(document.haystack, searchQuery));
  }, [documents, hasActiveSearch, searchQuery]);

  const { displayedItems, isLeaving } = useSearchStagger(searchQuery, visibleDocuments);

  return (
    <section aria-label="Document library" className="shell-sidebar-library">
      <div className="shell-sidebar-section-header">
        <p>Library</p>
        <button onClick={onOpenDocumentsPage} type="button">
          View all
        </button>
      </div>
      <SearchField
        aria-label="Search notes"
        inputRef={searchRef}
        onChange={setSearchQuery}
        placeholder="Search notes"
        value={searchQuery}
      />

      {!isTauri() ? (
        <p className="shell-sidebar-status" role="status">
          Open the Loci Notepad desktop app to browse notes.
        </p>
      ) : null}
      {status === 'loading' ? <p className="shell-sidebar-status">Loading notes...</p> : null}
      {status === 'error' ? (
        <p className="shell-sidebar-status" role="alert">
          {error ?? 'Could not load notes.'}
        </p>
      ) : null}
      {status === 'ready' && documents.length === 0 ? (
        <p className="shell-sidebar-status">No notes yet.</p>
      ) : null}
      {status === 'ready' && documents.length > 0 && displayedItems.length === 0 ? (
        <p className="shell-sidebar-status">No notes match your search.</p>
      ) : null}

      <div className={`shell-sidebar-documents${isLeaving ? ' leaving' : ''}`} data-stagger>
        {displayedItems.map((document, index) => (
          <button
            className="shell-sidebar-document"
            key={document.id}
            onClick={() => onOpenDocument(document.id)}
            style={{ '--stagger-index': index } as CSSProperties}
            type="button"
          >
            <span className="shell-sidebar-document-copy">
              <strong>{document.title}</strong>
              <span>{document.preview || document.meta}</span>
            </span>
            <ChevronRight size={15} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </section>
  );
}
