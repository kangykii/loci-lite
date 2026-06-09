import { Check, ListFilter } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ATOM_FILTER_OPTIONS, type AtomFilter } from '../../lib/atomLabels';

type BookmarkFilterMenuProps = {
  filter: AtomFilter;
  onFilterChange: (filter: AtomFilter) => void;
};

export default function BookmarkFilterMenu({
  filter,
  onFilterChange,
}: BookmarkFilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeLabel =
    ATOM_FILTER_OPTIONS.find((option) => option.id === filter)?.label ?? 'Filter';

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
    <div className="bookmark-filter-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="atoms-filter"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <ListFilter size={15} strokeWidth={1.5} />
        {filter === 'all' ? 'Filter' : activeLabel}
      </button>
      {isOpen ? (
        <div className="bookmark-filter-panel" role="menu">
          {ATOM_FILTER_OPTIONS.map((option) => {
            const isActive = filter === option.id;

            return (
              <button
                key={option.id}
                className={`bookmark-filter-item ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  onFilterChange(option.id);
                  setIsOpen(false);
                }}
                role="menuitemradio"
                aria-checked={isActive}
                type="button"
              >
                <span>{option.label}</span>
                {isActive ? <Check aria-hidden="true" size={14} strokeWidth={2} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
