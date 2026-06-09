import { useEffect, useId, useRef } from 'react';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  error?: string | null;
  confirmLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  error = null,
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-dialog-layer" role="presentation">
      <button
        aria-label="Cancel"
        className="confirm-dialog-scrim"
        onClick={onCancel}
        type="button"
      />
      <div
        ref={panelRef}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirm-dialog"
        role="alertdialog"
      >
        <h2 className="confirm-dialog-title" id={titleId}>
          {title}
        </h2>
        <p className="confirm-dialog-message" id={descriptionId}>
          {message}
        </p>
        {error ? (
          <p className="confirm-dialog-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="confirm-dialog-actions">
          <button
            className="confirm-dialog-cancel"
            disabled={isConfirming}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="confirm-dialog-confirm"
            disabled={isConfirming}
            onClick={onConfirm}
            type="button"
          >
            {isConfirming ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
