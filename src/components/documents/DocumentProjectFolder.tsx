import { ChevronDown, Folder } from 'lucide-react';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import {
  consumeBrowseDragClick,
  endBrowseDrag,
  startBrowseDrag,
} from '../../lib/browseDrag';
import type { DocumentProjectItem } from '../../lib/documentProjectFolders';
import { useDocumentDrop } from './documentDrop';

type DocumentProjectFolderProps = {
  canDrag: boolean;
  displayName: string;
  index: number;
  item: DocumentProjectItem;
  isExpanded: boolean;
  onContextMenu?: (event: MouseEvent, item: DocumentProjectItem, displayName: string) => void;
  onProjectDrop?: (draggedId: string, targetId: string) => void;
  onToggle: () => void;
};

export default function DocumentProjectFolder({
  canDrag,
  displayName,
  index,
  isExpanded,
  item,
  onContextMenu,
  onProjectDrop,
  onToggle,
}: DocumentProjectFolderProps) {
  const representative = item.representative;
  const { dropHandlers, isProjectDropTarget } = useDocumentDrop({
    enabled: canDrag,
    onProjectDrop,
    targetId: representative.id,
  });

  const label = item.projectCount === 1 ? '1 note' : `${item.projectCount} notes`;
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <article
      aria-label={`${displayName}, ${label}`}
      className={`document-project-folder ${isProjectDropTarget ? 'is-project-drop-target' : ''}`}
      draggable={canDrag}
      role="button"
      style={{ '--stagger-index': index } as CSSProperties}
      tabIndex={0}
      onClick={() => {
        if (consumeBrowseDragClick()) return;
        onToggle();
      }}
      onContextMenu={(event) => onContextMenu?.(event, item, displayName)}
      onDragEnd={endBrowseDrag}
      onDragStart={(event) => {
        startBrowseDrag(
          event,
          { kind: 'document', id: representative.id },
          { primary: displayName, secondary: label },
        );
      }}
      onKeyDown={handleKeyDown}
      {...dropHandlers}
    >
      <span className="document-icon">
        <Folder size={16} strokeWidth={1.5} />
      </span>
      <span className="document-copy">
        <strong>{displayName}</strong>
        <span>{label}</span>
      </span>
      <button
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${displayName}`}
        className="document-project-toggle"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <ChevronDown size={16} strokeWidth={1.5} />
      </button>
    </article>
  );
}
