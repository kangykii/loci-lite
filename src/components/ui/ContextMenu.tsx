import { useEffect, useMemo, type ReactNode } from 'react';

export type ContextMenuItem = {
  kind?: 'item';
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  hidden?: boolean;
  onClick: () => void;
};

export type ContextMenuSeparator = {
  kind: 'separator';
  hidden?: boolean;
};

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

type ContextMenuProps = {
  x: number;
  y: number;
  items: ContextMenuEntry[];
  onClose: () => void;
};

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const visibleItems = useMemo(() => {
    const next: ContextMenuEntry[] = [];
    for (const item of items) {
      if (item.hidden) continue;
      if (item.kind === 'separator' && next[next.length - 1]?.kind === 'separator') continue;
      next.push(item);
    }
    return next.filter((item, index) => {
      if (item.kind !== 'separator') return true;
      return index > 0 && index < next.length - 1;
    });
  }, [items]);

  return (
    <div
      className="context-menu-layer"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="context-menu"
        onMouseDown={(event) => event.stopPropagation()}
        role="menu"
        style={{
          left: `min(${x}px, calc(100vw - var(--context-menu-w) - var(--space-2)))`,
          top: `min(${y}px, calc(100vh - 2 * var(--space-2)))`,
        }}
      >
        {visibleItems.map((item, index) =>
          item.kind === 'separator' ? (
            <div className="context-menu-separator" key={`sep-${index}`} role="separator" />
          ) : (
            <button
              key={`${item.label}-${index}`}
              className={`context-menu-item${item.destructive ? ' is-destructive' : ''}`}
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              role="menuitem"
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
