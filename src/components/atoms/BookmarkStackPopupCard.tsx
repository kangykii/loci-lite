import type { AnimationEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';

import type { AtomRecord } from '../../lib/atomTypes';
import BookmarkFlashcardFaces from './BookmarkFlashcardFaces';

export type StackCardDirection = 'next' | 'prev' | 'shuffle';

export type StackCardTransition = {
  phase: 'leave' | 'enter';
  direction: StackCardDirection;
} | null;

type BookmarkStackPopupCardProps = {
  atom: AtomRecord;
  cardIndex: number;
  cardTotal: number;
  documentTitle: string;
  isFlipped: boolean;
  stackTransition: StackCardTransition;
  onRequestEdit: (id: string) => void;
  onToggleFlip: () => void;
  onTransitionEnd: () => void;
};

export default function BookmarkStackPopupCard({
  atom,
  cardIndex,
  cardTotal,
  documentTitle,
  isFlipped,
  stackTransition,
  onRequestEdit,
  onToggleFlip,
  onTransitionEnd,
}: BookmarkStackPopupCardProps) {
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggleFlip();
    }
  };

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (!event.animationName.startsWith('stack-card-')) {
      return;
    }

    onTransitionEnd();
  };

  const leaveDirection =
    stackTransition?.phase === 'leave' ? stackTransition.direction : undefined;
  const enterDirection =
    stackTransition?.phase === 'enter' ? stackTransition.direction : undefined;

  return (
    <div
      aria-label={`${atom.sourceText}, card ${cardIndex + 1} of ${cardTotal}`}
      aria-pressed={isFlipped}
      className={`bookmark-stack-popup-card bookmark-flashcard ${isFlipped ? 'is-flipped' : ''}`}
      data-stack-enter={enterDirection}
      data-stack-leave={leaveDirection}
      onAnimationEnd={handleAnimationEnd}
      onClick={onToggleFlip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <BookmarkFlashcardFaces
        atom={atom}
        documentTitle={documentTitle}
        onRequestEdit={onRequestEdit}
      />
    </div>
  );
}
