import { useEffect, useId, useState } from 'react';
import SegmentedControl from '../ui/SegmentedControl';

export type ExtractSubmission = {
  mode: 'link' | 'paste';
  value: string;
};

type ExtractDialogProps = {
  error: string | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (submission: ExtractSubmission) => void;
};

const MODE_OPTIONS = [
  { label: 'Link', value: 'link' as const },
  { label: 'Paste', value: 'paste' as const },
];

export default function ExtractDialog({
  error,
  isOpen,
  isSubmitting,
  onCancel,
  onSubmit,
}: ExtractDialogProps) {
  const [mode, setMode] = useState<'link' | 'paste'>('link');
  const [url, setUrl] = useState('');
  const [pasted, setPasted] = useState('');
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      setMode('link');
      setUrl('');
      setPasted('');
    }
  }, [isOpen]);

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

  const isLinkValid = /^https?:\/\/.+/i.test(url.trim());
  const isPasteValid = pasted.trim().length > 0;
  const canSubmit = mode === 'link' ? isLinkValid : isPasteValid;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit({ mode, value: mode === 'link' ? url.trim() : pasted });
  };

  return (
    <div className="confirm-dialog-layer" role="presentation">
      <button
        aria-label="Cancel"
        className="confirm-dialog-scrim"
        onClick={onCancel}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirm-dialog extract-dialog"
        role="dialog"
      >
        <h2 className="confirm-dialog-title" id={titleId}>
          Extract text
        </h2>
        <SegmentedControl
          aria-label="Extract from"
          fullWidth
          onChange={setMode}
          options={MODE_OPTIONS}
          value={mode}
        />
        {mode === 'link' ? (
          <>
            <p className="confirm-dialog-message">
              Paste a link you have open — a shared ChatGPT or Claude conversation link works
              well.
            </p>
            <input
              autoFocus
              className="extract-dialog-input"
              disabled={isSubmitting}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canSubmit && !isSubmitting) {
                  handleSubmit();
                }
              }}
              placeholder="https://…"
              type="url"
              value={url}
            />
          </>
        ) : (
          <>
            <p className="confirm-dialog-message">
              For pages that need you to be signed in — like a ChatGPT or Claude chat — open it,
              select all (Ctrl/Cmd+A), copy (Ctrl/Cmd+C), then paste below.
            </p>
            <textarea
              autoFocus
              className="extract-dialog-textarea"
              disabled={isSubmitting}
              onChange={(event) => setPasted(event.target.value)}
              placeholder="Paste the page content here…"
              value={pasted}
            />
          </>
        )}
        {error ? (
          <p className="confirm-dialog-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="confirm-dialog-actions">
          <button
            className="confirm-dialog-cancel"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="confirm-dialog-confirm extract-dialog-confirm"
            disabled={isSubmitting || !canSubmit}
            onClick={handleSubmit}
            type="button"
          >
            {isSubmitting ? 'Extracting…' : 'Extract'}
          </button>
        </div>
      </div>
    </div>
  );
}
