import { useMemo } from 'react';
import type { SearchableDocument } from '../../hooks/useSearchableDocuments';
import { matchesSearch } from '../../lib/searchMatch';

type SearchInNotesModalProps = {
  query: string;
  documents: SearchableDocument[];
  onClose: () => void;
  onOpenDocument: (fileId: string) => void;
};

export default function SearchInNotesModal({
  query,
  documents,
  onClose,
  onOpenDocument,
}: SearchInNotesModalProps) {
  const results = useMemo(
    () =>
      documents
        .filter((document) => matchesSearch(document.haystack, query))
        .slice(0, 12),
    [documents, query],
  );

  return (
    <div className="search-notes-layer" onMouseDown={onClose} role="presentation">
      <section
        aria-label="Search in notes results"
        className="search-notes-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="search-notes-header">
          <div>
            <h2>Search in notes</h2>
            <p>{query}</p>
          </div>
          <button className="search-notes-close" onClick={onClose} type="button">
            Close
          </button>
        </header>
        <div className="search-notes-results">
          {results.length === 0 ? (
            <p className="search-notes-empty">No notes match this search.</p>
          ) : null}
          {results.map((document) => (
            <button
              className="search-notes-result"
              key={document.id}
              onClick={() => {
                onOpenDocument(document.id);
                onClose();
              }}
              type="button"
            >
              <strong>{document.title}</strong>
              <span>{document.preview || document.meta}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
