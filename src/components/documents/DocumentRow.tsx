import { ChevronRight, FileText } from 'lucide-react';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import {
  consumeBrowseDragClick,
  endBrowseDrag,
  startBrowseDrag,
} from '../../lib/browseDrag';
import type { SearchableDocument } from '../../hooks/useSearchableDocuments';
import { useDocumentDrop } from './documentDrop';

type DocumentRowProps = {
  canDrag: boolean;
  document: SearchableDocument;
  index: number;
  onContextMenu: (event: MouseEvent, document: SearchableDocument) => void;
  onOpen: (fileId: string) => void;
  onProjectDrop?: (draggedId: string, targetId: string) => void;
};

export default function DocumentRow({
  canDrag,
  document,
  index,
  onContextMenu,
  onOpen,
  onProjectDrop,
}: DocumentRowProps) {
  const { dropHandlers, isProjectDropTarget } = useDocumentDrop({
    enabled: canDrag,
    onProjectDrop,
    targetId: document.id,
  });

  const openDocument = () => {
    if (consumeBrowseDragClick()) return;
    onOpen(document.id);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(document.id);
    }
  };

  return (
    <div
      aria-label={`Open ${document.title}`}
      className={`document-row ${isProjectDropTarget ? 'is-project-drop-target' : ''}`}
      draggable={canDrag}
      role="button"
      style={{ '--stagger-index': index } as CSSProperties}
      tabIndex={0}
      onClick={openDocument}
      onContextMenu={(event) => onContextMenu(event, document)}
      onDragEnd={endBrowseDrag}
      onDragStart={(event) => {
        startBrowseDrag(
          event,
          { kind: 'document', id: document.id },
          { primary: document.title, secondary: 'Note' },
        );
      }}
      onKeyDown={handleKeyDown}
      {...dropHandlers}
    >
      <span className="document-icon">
        <FileText size={16} strokeWidth={1.5} />
      </span>
      <span className="document-copy">
        <strong>{document.title}</strong>
        <span>{document.meta}</span>
      </span>
      <ChevronRight size={16} strokeWidth={1.5} />
    </div>
  );
}
