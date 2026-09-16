import type { DragEventHandler } from 'react';
import { Link2, PanelsTopLeft, Upload } from 'lucide-react';

type NewNoteActionsProps = {
  error: string | null;
  isBusy: boolean;
  isDragOver: boolean;
  onDragLeave: DragEventHandler<HTMLButtonElement>;
  onDragOver: DragEventHandler<HTMLButtonElement>;
  onDrop: DragEventHandler<HTMLButtonElement>;
  onExtract: () => void;
  onUpload: () => void;
  onOpenNewTab?: () => void;
};

export default function NewNoteActions({
  error,
  isBusy,
  isDragOver,
  onDragLeave,
  onDragOver,
  onDrop,
  onExtract,
  onUpload,
  onOpenNewTab,
}: NewNoteActionsProps) {
  return (
    <div className="new-note-actions" role="presentation">
      <p className="new-note-actions-label">Actions</p>
      <div className="new-note-actions-cards">
        <button
          className={`creation-card new-note-action${isDragOver ? ' is-drag-over' : ''}`}
          disabled={isBusy}
          onClick={onUpload}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          type="button"
        >
          <span className="creation-badge">
            <Upload size={16} strokeWidth={1.5} />
          </span>
          <span className="creation-copy">
            <strong>Upload document</strong>
            <span>{isDragOver ? 'Drop the PDF to extract it' : 'Extract text from a PDF'}</span>
          </span>
        </button>
        <button
          className="creation-card new-note-action"
          disabled={isBusy}
          onClick={onExtract}
          type="button"
        >
          <span className="creation-badge">
            <Link2 size={16} strokeWidth={1.5} />
          </span>
          <span className="creation-copy">
            <strong>Extract</strong>
            <span>Pull text from a link</span>
          </span>
        </button>
        {onOpenNewTab ? (
          <button className="creation-card new-note-action" disabled={isBusy} onClick={onOpenNewTab} type="button">
            <span className="creation-badge"><PanelsTopLeft size={16} strokeWidth={1.5} /></span>
            <span className="creation-copy"><strong>Open new tab</strong><span>Replace this note or open side by side</span></span>
          </button>
        ) : null}
      </div>
      {isBusy ? <p className="new-note-actions-status">Extracting text…</p> : null}
      {error ? (
        <p className="new-note-actions-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
