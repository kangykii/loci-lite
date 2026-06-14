import type { CSSProperties } from 'react';
import type { MouseEvent } from 'react';

import SearchField from '../ui/SearchField';
import type { SearchableDocument } from '../../hooks/useSearchableDocuments';

type RecentFilesProps = {
  files: SearchableDocument[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  searchQuery: string;
  hasActiveSearch: boolean;
  hasLibrary: boolean;
  onSearchChange: (query: string) => void;
  onOpenEditor: (fileId: string) => void;
  onOpenDocuments: () => void;
  onDocumentContextMenu?: (event: MouseEvent, document: SearchableDocument) => void;
  listStaggerLeaving?: boolean;
};

export default function RecentFiles({
  files,
  status,
  searchQuery,
  hasActiveSearch,
  hasLibrary,
  onSearchChange,
  onOpenEditor,
  onOpenDocuments,
  onDocumentContextMenu,
  listStaggerLeaving = false,
}: RecentFilesProps) {
  return (
    <section aria-label="Recent files">
      <div className="library-controls">
        <SearchField
          aria-label="Search notes"
          onChange={onSearchChange}
          placeholder="Search notes"
          showLeadingIcon={false}
          value={searchQuery}
          variant="pill"
        />
        <button className="view-all-button" onClick={onOpenDocuments} type="button">
          View all
        </button>
      </div>

      {status === 'loading' ? (
        <p className="library-status">Loading recent notes…</p>
      ) : null}

      {status === 'ready' && !hasLibrary ? (
        <p className="library-status">No notes yet. Create one above.</p>
      ) : null}

      {status === 'ready' && hasLibrary && hasActiveSearch && files.length === 0 ? (
        <p className="library-status">No notes match your search.</p>
      ) : null}

      <div className={`recent-list${listStaggerLeaving ? ' leaving' : ''}`} data-stagger="horizontal">
        {files.map((file, index) => (
          <button
            className="recent-row"
            key={file.id}
            onClick={() => onOpenEditor(file.id)}
            onContextMenu={(event) => onDocumentContextMenu?.(event, file)}
            style={{ '--stagger-index': index } as CSSProperties}
            type="button"
          >
            {file.preview ? <div className="recent-preview">{file.preview}</div> : null}
            <div className="recent-name">{file.title}</div>
            <div className="recent-date">{file.meta}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
