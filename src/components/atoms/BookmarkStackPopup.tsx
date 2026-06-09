import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { shuffleAtomRecords } from '../../lib/bookmarkStacks';
import type { AtomRecord } from '../../lib/atomTypes';
import BookmarkStackNameEditor from './BookmarkStackNameEditor';
import BookmarkStackPopupCard, {
  type StackCardDirection,
  type StackCardTransition,
} from './BookmarkStackPopupCard';
import BookmarkStackPopupNav from './BookmarkStackPopupNav';

type BookmarkStackPopupProps = {
  groupLabel: string;
  folderName: string;
  members: AtomRecord[];
  documentTitles: Record<string, string>;
  onClose: () => void;
  onRenameStack: (groupLabel: string, name: string) => void;
  onRequestEdit: (id: string) => void;
};

type PendingNav = {
  index: number;
  orderedMembers?: AtomRecord[];
};

export default function BookmarkStackPopup({
  groupLabel,
  folderName,
  members,
  documentTitles,
  onClose,
  onRenameStack,
  onRequestEdit,
}: BookmarkStackPopupProps) {
  const [orderedMembers, setOrderedMembers] = useState(members);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stackTransition, setStackTransition] = useState<StackCardTransition>(null);
  const pendingNavRef = useRef<PendingNav | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const memberKey = useMemo(
    () => members.map((member) => member.id).join('\0'),
    [members],
  );
  const total = orderedMembers.length;
  const current = orderedMembers[index];
  const isNavLocked = stackTransition !== null;

  useEffect(() => {
    setOrderedMembers(members);
    setIndex(0);
    setIsFlipped(false);
    setStackTransition(null);
    pendingNavRef.current = null;
  }, [memberKey, members]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [onClose]);

  if (!current) {
    return null;
  }

  const documentTitle = documentTitles[current.fileId] ?? 'Untitled';

  const startTransition = (direction: StackCardDirection, pending: PendingNav) => {
    if (isNavLocked) {
      return;
    }

    setIsFlipped(false);
    pendingNavRef.current = pending;
    setStackTransition({ phase: 'leave', direction });
  };

  const goPrev = () => {
    startTransition('prev', {
      index: index === 0 ? total - 1 : index - 1,
    });
  };

  const goNext = () => {
    startTransition('next', {
      index: index === total - 1 ? 0 : index + 1,
    });
  };

  const handleShuffle = () => {
    startTransition('shuffle', {
      index: 0,
      orderedMembers: shuffleAtomRecords(members),
    });
  };

  const handleTransitionEnd = () => {
    if (stackTransition?.phase === 'leave') {
      const pending = pendingNavRef.current;

      if (pending) {
        if (pending.orderedMembers) {
          setOrderedMembers(pending.orderedMembers);
        }

        setIndex(pending.index);
        pendingNavRef.current = null;
      }

      setStackTransition({ phase: 'enter', direction: stackTransition.direction });
      return;
    }

    if (stackTransition?.phase === 'enter') {
      setStackTransition(null);
    }
  };

  return (
    <div className="bookmark-stack-popup-layer" role="presentation">
      <button
        aria-label="Close stack"
        className="bookmark-stack-popup-scrim"
        onClick={onClose}
        type="button"
      />
      <div
        ref={panelRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className="bookmark-stack-popup"
        role="dialog"
      >
        <div className="bookmark-stack-popup-header" id={titleId}>
          <BookmarkStackNameEditor
            displayName={folderName}
            onRename={(name) => onRenameStack(groupLabel, name)}
            variant="popup"
          />
        </div>
        <BookmarkStackPopupCard
          atom={current}
          cardIndex={index}
          cardTotal={total}
          documentTitle={documentTitle}
          isFlipped={isFlipped}
          onRequestEdit={(id) => {
            setIsFlipped(false);
            onRequestEdit(id);
          }}
          onToggleFlip={() => {
            if (isNavLocked) {
              return;
            }

            setIsFlipped((value) => !value);
          }}
          onTransitionEnd={handleTransitionEnd}
          stackTransition={stackTransition}
        />
        <BookmarkStackPopupNav
          disabled={isNavLocked}
          index={index}
          onNext={goNext}
          onPrev={goPrev}
          onShuffle={handleShuffle}
          total={total}
        />
      </div>
    </div>
  );
}
