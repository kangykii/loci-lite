import { createPortal } from 'react-dom';
import type { NotificationItem } from '../../lib/notifications';
import NotificationChip from './NotificationChip';

type NotificationHostProps = {
  items: NotificationItem[];
  leavingIds: ReadonlySet<string>;
  onDismiss: (id: string) => void;
};

export default function NotificationHost({ items, leavingIds, onDismiss }: NotificationHostProps) {
  if (items.length === 0) {
    return null;
  }

  return createPortal(
    <div aria-label="Notifications" className="notification-host" role="region">
      {items.map((item) => (
        <NotificationChip
          item={item}
          key={item.id}
          leaving={leavingIds.has(item.id)}
          onDismiss={onDismiss}
        />
      ))}
    </div>,
    document.body,
  );
}
