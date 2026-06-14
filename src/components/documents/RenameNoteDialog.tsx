import { useEffect, useState } from 'react';

type RenameNoteDialogProps = {
  dialogTitle?: string;
  initialTitle: string;
  isOpen: boolean;
  label?: string;
  onCancel: () => void;
  onRename: (title: string) => void;
  submitLabel?: string;
};

export default function RenameNoteDialog({
  dialogTitle = 'Rename note',
  initialTitle,
  isOpen,
  label = 'Rename note',
  onCancel,
  onRename,
  submitLabel = 'Rename',
}: RenameNoteDialogProps) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  if (!isOpen) return null;

  return (
    <div className="rename-note-layer" onMouseDown={onCancel} role="presentation">
      <form
        className="rename-note-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onRename(title);
        }}
      >
        <h2>{dialogTitle}</h2>
        <label>
          <span>{label}</span>
          <input
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <div className="rename-note-actions">
          <button onClick={onCancel} type="button">
            Cancel
          </button>
          <button disabled={!title.trim()} type="submit">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
