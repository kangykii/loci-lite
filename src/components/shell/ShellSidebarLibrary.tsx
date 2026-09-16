import { useMemo, type CSSProperties } from 'react';
import { Pin } from 'lucide-react';
import ShellSidebarDocumentSkeleton from './ShellSidebarDocumentSkeleton';
import { useDelayedFlag } from '../../hooks/useDelayedFlag';
import { useSidebarNotes } from '../../hooks/useSidebarNotes';
import { displayTitleForFile } from '../../lib/documentMeta';
import { formatRelativeTimeShort } from '../../lib/formatRelativeTime';
import type { FileRecord } from '../../store/files.store';

type ShellSidebarLibraryProps = {
  activeFileId: string | null;
  listRefreshKey: number;
  onOpenDocument: (fileId: string) => void;
};

export default function ShellSidebarLibrary({
  activeFileId,
  listRefreshKey,
  onOpenDocument,
}: ShellSidebarLibraryProps) {
  const { recentNotes, pinnedNotes, status } = useSidebarNotes(listRefreshKey);
  const showLoadingSkeleton = useDelayedFlag(status === 'loading');

  const visiblePinnedNotes = useMemo(
    () => pinnedNotes.filter((note) => !recentNotes.some((recent) => recent.id === note.id)),
    [pinnedNotes, recentNotes],
  );

  const renderNote = (note: FileRecord, index: number) => (
    <button
      aria-current={note.id === activeFileId ? 'page' : undefined}
      className={`shell-sidebar-document${note.id === activeFileId ? ' active' : ''}`}
      key={note.id}
      onClick={() => onOpenDocument(note.id)}
      style={{ '--stagger-index': index } as CSSProperties}
      type="button"
    >
      <span className="shell-sidebar-document-title">
        {displayTitleForFile(note.title, note.path)}
      </span>
      <span className="shell-sidebar-document-time">{formatRelativeTimeShort(note.openedAt)}</span>
    </button>
  );

  return (
    <section aria-label="Recent and pinned notes" className="shell-sidebar-library">
      <div className="shell-sidebar-section-header">
        <p>Recent</p>
      </div>

      {status === 'error' ? (
        <p className="shell-sidebar-status" role="alert">
          Could not load notes.
        </p>
      ) : null}
      {status === 'ready' && recentNotes.length === 0 ? (
        <p className="shell-sidebar-status">No notes yet.</p>
      ) : null}

      <div className="shell-sidebar-documents" data-stagger>
        {showLoadingSkeleton
          ? [0, 1, 2].map((index) => <ShellSidebarDocumentSkeleton index={index} key={index} />)
          : null}
        {recentNotes.map(renderNote)}
      </div>

      {visiblePinnedNotes.length > 0 ? (
        <section aria-label="Pinned notes" className="shell-sidebar-pinned">
          <div className="shell-sidebar-section-header">
            <p>Pinned</p>
          </div>
          <div className="shell-sidebar-documents" data-stagger>
            {visiblePinnedNotes.map((note, index) => (
              <div className="shell-sidebar-pinned-row" key={note.id}>
                <Pin aria-hidden size={14} strokeWidth={1.5} />
                {renderNote(note, index)}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
