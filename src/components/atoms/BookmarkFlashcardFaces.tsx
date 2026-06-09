import { Pencil } from 'lucide-react';

import { ATOM_TYPE_LABELS } from '../../lib/atomLabels';
import type { AtomRecord } from '../../lib/atomTypes';

type BookmarkFlashcardFacesProps = {
  atom: AtomRecord;
  documentTitle: string;
  onRequestEdit?: (id: string) => void;
  showEdit?: boolean;
};

function CardFooter({
  documentTitle,
  type,
}: {
  documentTitle: string;
  type: AtomRecord['type'];
}) {
  return (
    <footer className="bookmark-flashcard-footer">
      <span className="bookmark-flashcard-meta">
        <span className="bookmark-flashcard-type">{ATOM_TYPE_LABELS[type]}</span>
        <span aria-hidden="true" className="bookmark-flashcard-meta-sep">
          ·
        </span>
        <span className="bookmark-flashcard-doc">{documentTitle}</span>
      </span>
    </footer>
  );
}

export default function BookmarkFlashcardFaces({
  atom,
  documentTitle,
  onRequestEdit,
  showEdit = true,
}: BookmarkFlashcardFacesProps) {
  return (
    <div className="bookmark-flashcard-inner">
      <div className="bookmark-flashcard-face bookmark-flashcard-front">
        <div className="bookmark-flashcard-body">
          <p className="bookmark-flashcard-source">{atom.sourceText}</p>
        </div>
        <CardFooter documentTitle={documentTitle} type={atom.type} />
      </div>
      <div className="bookmark-flashcard-face bookmark-flashcard-back">
        {showEdit && onRequestEdit ? (
          <button
            aria-label="Edit bookmark"
            className="bookmark-flashcard-edit"
            onClick={(event) => {
              event.stopPropagation();
              onRequestEdit(atom.id);
            }}
            type="button"
          >
            <Pencil size={14} strokeWidth={1.5} />
          </button>
        ) : null}
        <div className="bookmark-flashcard-body">
          <p className="bookmark-flashcard-content">{atom.answer}</p>
        </div>
        <CardFooter documentTitle={documentTitle} type={atom.type} />
      </div>
    </div>
  );
}
