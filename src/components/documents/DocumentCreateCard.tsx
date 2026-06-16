import { Plus } from 'lucide-react';

type DocumentCreateCardProps = {
  canCreate: boolean;
  isCreating?: boolean;
  onCreateNote: () => void;
};

export default function DocumentCreateCard({
  canCreate,
  isCreating,
  onCreateNote,
}: DocumentCreateCardProps) {
  return (
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
        <strong>{isCreating ? 'Creating...' : 'Add a new document'}</strong>
        <span>Start from a blank note</span>
      </span>
    </button>
  );
}
