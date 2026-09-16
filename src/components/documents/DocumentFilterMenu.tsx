import { Check, ListFilter } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Scope = 'all' | 'pinned' | 'projects' | 'loose';
type Sort = 'recent' | 'title';

type DocumentFilterMenuProps = {
  scope: Scope;
  sort: Sort;
  onScopeChange: (scope: Scope) => void;
  onSortChange: (sort: Sort) => void;
};

const scopes: Array<{ id: Scope; label: string }> = [
  { id: 'all', label: 'All notes' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'projects', label: 'Projects' },
  { id: 'loose', label: 'Unfiled' },
];

export default function DocumentFilterMenu({ scope, sort, onScopeChange, onSortChange }: DocumentFilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const chooseScope = (next: Scope) => {
    onScopeChange(next);
    setIsOpen(false);
  };
  const chooseSort = (next: Sort) => {
    onSortChange(next);
    setIsOpen(false);
  };

  return (
    <div className="document-filter-menu" ref={menuRef}>
      <button aria-expanded={isOpen} aria-haspopup="menu" className="documents-filter" onClick={() => setIsOpen((open) => !open)} type="button">
        <ListFilter size={15} strokeWidth={1.5} /> Filter
      </button>
      {isOpen ? <div className="document-filter-panel" role="menu">
        <span>Show</span>
        {scopes.map((option) => <button aria-checked={scope === option.id} className={scope === option.id ? 'is-active' : ''} key={option.id} onClick={() => chooseScope(option.id)} role="menuitemradio" type="button"><span>{option.label}</span>{scope === option.id ? <Check size={14} strokeWidth={2} /> : null}</button>)}
        <span className="document-filter-divider">Sort</span>
        <button aria-checked={sort === 'recent'} className={sort === 'recent' ? 'is-active' : ''} onClick={() => chooseSort('recent')} role="menuitemradio" type="button"><span>Last edited</span>{sort === 'recent' ? <Check size={14} strokeWidth={2} /> : null}</button>
        <button aria-checked={sort === 'title'} className={sort === 'title' ? 'is-active' : ''} onClick={() => chooseSort('title')} role="menuitemradio" type="button"><span>Title A–Z</span>{sort === 'title' ? <Check size={14} strokeWidth={2} /> : null}</button>
      </div> : null}
    </div>
  );
}
