import { Bookmark, Plus } from 'lucide-react';

type HomeQuickActionsProps = {
  onCreateNote: () => void;
  onOpenBookmarks: () => void;
  isCreating?: boolean;
  canCreate: boolean;
};

export default function HomeQuickActions({
  onCreateNote,
  onOpenBookmarks,
  isCreating,
  canCreate,
}: HomeQuickActionsProps) {
  return (
    <div className="home-actions">
      <button
        className="creation-card new-note-card"
        disabled={!canCreate || isCreating}
        onClick={onCreateNote}
        type="button"
      >
        <span className="creation-badge">
          <Plus size={16} strokeWidth={1.5} />
        </span>
        <span className="creation-copy">
          <strong>{isCreating ? 'Creating…' : 'New note'}</strong>
          <span>
            {canCreate
              ? 'Open a blank writing surface.'
              : 'Run the desktop app to create notes.'}
          </span>
        </span>
      </button>
      <button
        className="creation-card bookmarks-quick-card"
        onClick={onOpenBookmarks}
        type="button"
      >
        <span className="creation-badge">
          <Bookmark size={16} strokeWidth={1.5} />
        </span>
        <span className="creation-copy">
          <strong>Bookmarks</strong>
          <span>Flashcards & highlights</span>
        </span>
      </button>
    </div>
  );
}
