import type { CSSProperties, KeyboardEvent } from 'react';
import {
  consumeBrowseDragClick,
  endBrowseDrag,
  startBrowseDrag,
} from '../../lib/browseDrag';
import type { SearchableDocument } from '../../hooks/useSearchableDocuments';

type DocumentProjectMemberRowProps = {
  displayName: string;
  document: SearchableDocument;
  index: number;
  onOpenDocument: (fileId: string) => void;
};

export default function DocumentProjectMemberRow({
  displayName,
  document,
  index,
  onOpenDocument,
}: DocumentProjectMemberRowProps) {
  const openDocument = () => {
    if (consumeBrowseDragClick()) return;
    onOpenDocument(document.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenDocument(document.id);
    }
  };

  return (
    <div
      aria-label={`Open ${document.title}`}
      className="document-project-member-row"
      draggable
      role="button"
      style={{ '--stagger-index': index } as CSSProperties}
      tabIndex={0}
      onClick={openDocument}
      onDragEnd={endBrowseDrag}
      onDragOver={(event) => event.stopPropagation()}
      onDragStart={(event) => {
        startBrowseDrag(
          event,
          { kind: 'document', id: document.id },
          { primary: document.title, secondary: displayName },
        );
      }}
      onDrop={(event) => event.stopPropagation()}
      onKeyDown={handleKeyDown}
    >
      <span className="document-copy">
        <strong>{document.title}</strong>
        <span>{document.meta}</span>
      </span>
    </div>
  );
}
