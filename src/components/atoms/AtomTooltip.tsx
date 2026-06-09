import { Bookmark } from 'lucide-react';
import type { AtomType } from '../../lib/atomTypes';

export type AtomTooltipData = {
  id: string;
  type: AtomType;
  content: string;
  sourceText: string;
};

type AtomTooltipProps = {
  atom: AtomTooltipData;
  x: number;
  y: number;
  onDelete: (id: string) => void;
};

const TYPE_LABELS: Record<AtomType, string> = {
  definition: 'Definition',
  note: 'Note',
  reminder: 'Reminder',
};

export default function AtomTooltip({ atom, x, y, onDelete }: AtomTooltipProps) {
  return (
    <div
      className="atom-tooltip"
      role="tooltip"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="atom-tooltip-header">
        <span className="atom-tooltip-type">{TYPE_LABELS[atom.type]}</span>
        <button
          aria-label="Remove bookmark"
          className="atom-tooltip-delete"
          onClick={() => onDelete(atom.id)}
          type="button"
        >
          <Bookmark size={14} strokeWidth={1.5} />
        </button>
      </div>
      <p className="atom-tooltip-content">{atom.content}</p>
      <p className="atom-tooltip-source">{atom.sourceText}</p>
    </div>
  );
}
