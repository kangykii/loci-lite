import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SegmentedControl from '../ui/SegmentedControl';
import { displayTitleForFile } from '../../lib/documentMeta';
import { listAllFiles, type FileRecord } from '../../store/files.store';

type Props = {
  currentFileId: string;
  otherFileId?: string | null;
  canSplit: boolean;
  onClose: () => void;
  onSelect: (fileId: string, placement: 'replace' | 'split') => Promise<void>;
};

export default function OpenDocumentPopup({ currentFileId, otherFileId, canSplit, onClose, onSelect }: Props) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [query, setQuery] = useState('');
  const [placement, setPlacement] = useState<'replace' | 'split'>('replace');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void listAllFiles().then((rows) => {
      if (!cancelled) setFiles(rows.filter((row) => row.id !== currentFileId && row.id !== otherFileId));
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Failed to load documents');
    });
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [busy, currentFileId, otherFileId, onClose]);

  useEffect(() => {
    if (!canSplit && placement === 'split') {
      setPlacement('replace');
    }
  }, [canSplit, placement]);

  const matches = files.filter((file) =>
    displayTitleForFile(file.title, file.path).toLowerCase().includes(query.toLowerCase()),
  );

  return createPortal(
    <div className="confirm-dialog-layer" role="presentation">
      <button aria-label="Dismiss open document" className="confirm-dialog-scrim" onClick={onClose} type="button" />
      <div aria-label="Open new tab" aria-modal="true" className="confirm-dialog open-document-popup" role="dialog">
        <h2 className="confirm-dialog-title">Open new tab</h2>
        <SegmentedControl
          aria-label="How to open"
          fullWidth
          onChange={setPlacement}
          options={[
            { label: 'Replace this tab', value: 'replace' },
            { disabled: !canSplit, label: 'Open next to this tab', value: 'split' },
          ]}
          value={placement}
        />
        {!canSplit ? <p className="open-document-hint">Split view needs a wider window.</p> : null}
        <input aria-label="Find a document" onChange={(event) => setQuery(event.target.value)} placeholder="Find a document…" ref={inputRef} value={query} />
        <div className="open-document-list">
          {matches.length ? matches.map((file) => (
            <button disabled={busy} key={file.id} onClick={() => {
              setBusy(true);
              setError(null);
              void onSelect(file.id, placement).catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : 'Could not open document');
                setBusy(false);
              });
            }} type="button">{displayTitleForFile(file.title, file.path)}</button>
          )) : <p>No other documents found.</p>}
        </div>
        {error ? <p className="open-document-error" role="alert">{error}</p> : null}
      </div>
    </div>,
    document.body,
  );
}
