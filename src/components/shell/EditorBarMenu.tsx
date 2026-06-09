import { MoreVertical } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import AppleToggle from '../ui/AppleToggle';

type EditorBarMenuProps = {
  isAuthorshipOn: boolean;
  isFocusMode: boolean;
  isBookmarkHighlightOn: boolean;
  isTypewriterOn: boolean;
  onDeleteNote: () => void;
  onAuthorshipToggle: () => void;
  onBookmarkHighlightToggle: () => void;
  onFocusModeToggle: () => void;
  onTypewriterToggle: () => void;
};

type MenuToggleItem = {
  checked: boolean;
  id: string;
  label: string;
  onToggle: () => void;
  shortcut: string;
};

export default function EditorBarMenu({
  isAuthorshipOn,
  isFocusMode,
  isBookmarkHighlightOn,
  isTypewriterOn,
  onDeleteNote,
  onAuthorshipToggle,
  onBookmarkHighlightToggle,
  onFocusModeToggle,
  onTypewriterToggle,
}: EditorBarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusId = useId();
  const authorshipId = useId();
  const bookmarkHighlightId = useId();
  const typewriterId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="editor-bar-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Editor options"
        className="titlebar-icon-button editor-bar-menu-trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <MoreVertical size={16} strokeWidth={1.5} />
      </button>
      {isOpen ? (
        <div className="editor-bar-menu-panel" role="menu">
          {[
            {
              checked: isFocusMode,
              id: focusId,
              label: 'Focus',
              onToggle: onFocusModeToggle,
              shortcut: 'Ctrl+Shift+F',
            },
            {
              checked: isTypewriterOn,
              id: typewriterId,
              label: 'Typewriter',
              onToggle: onTypewriterToggle,
              shortcut: 'Ctrl+Shift+T',
            },
            {
              checked: isAuthorshipOn,
              id: authorshipId,
              label: 'Authorship',
              onToggle: onAuthorshipToggle,
              shortcut: 'Ctrl+Shift+A',
            },
            {
              checked: isBookmarkHighlightOn,
              id: bookmarkHighlightId,
              label: 'Bookmark highlight',
              onToggle: onBookmarkHighlightToggle,
              shortcut: 'Ctrl+Shift+B',
            },
          ].map((item: MenuToggleItem) => (
            <div className="menu-item-row" key={item.label} role="menuitem">
              <span className="menu-item-label" id={`${item.id}-label`}>
                {item.label}
              </span>
              <span className="menu-item-shortcut">{item.shortcut}</span>
              <AppleToggle
                checked={item.checked}
                id={item.id}
                label={item.label}
                layout="switch-only"
                onChange={() => item.onToggle()}
              />
            </div>
          ))}
          <button
            className="menu-item-row editor-bar-menu-destructive"
            onClick={() => {
              setIsOpen(false);
              onDeleteNote();
            }}
            role="menuitem"
            type="button"
          >
            <span className="menu-item-label destructive">Delete note</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
