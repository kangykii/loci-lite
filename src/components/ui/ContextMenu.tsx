import type { ReactNode } from 'react';

export type ContextMenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
};

type ContextMenuProps = {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
};

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
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
        style={{ left: `${x}px`, top: `${y}px` }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            className="context-menu-item"
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
        ))}
      </div>
    </div>
  );
}
