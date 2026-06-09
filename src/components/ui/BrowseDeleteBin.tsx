import { Trash2 } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import { readDragPayload, type DeletePayloadKind } from '../../lib/deletePayload';

type BrowseDeleteBinProps = {
  acceptKind: DeletePayloadKind;
  disabled?: boolean;
  onDrop: (id: string) => void;
};

export default function BrowseDeleteBin({
  acceptKind,
  disabled = false,
  onDrop,
}: BrowseDeleteBinProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    setIsDropTarget(true);
  };

  return (
    <div
      aria-disabled={disabled}
      aria-label="Delete by dropping items here"
      className={`browse-delete-bin ${isDropTarget ? 'is-drop-target' : ''} ${
        disabled ? 'is-disabled' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setIsDropTarget(false);
        }
      }}
      onDragOver={(event) => {
        if (disabled) {
          return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setIsDropTarget(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDropTarget(false);

        if (disabled) {
          return;
        }

        const payload = readDragPayload(event.dataTransfer);

        if (payload?.kind === acceptKind) {
          onDrop(payload.id);
        }
      }}
    >
      <Trash2 size={16} strokeWidth={1.5} />
    </div>
  );
}
