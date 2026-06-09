import { Check, CircleAlert, X } from 'lucide-react';
import type { NotificationItem } from '../../lib/notifications';

type NotificationChipProps = {
  item: NotificationItem;
  leaving?: boolean;
  onDismiss: (id: string) => void;
};

export default function NotificationChip({ item, leaving = false, onDismiss }: NotificationChipProps) {
  const Icon = item.tone === 'error' ? CircleAlert : Check;

  return (
    <div
      aria-live={item.tone === 'error' ? 'assertive' : 'polite'}
      className={`notification-chip notification-chip--${item.tone}${leaving ? ' is-leaving' : ''}`}
      data-state={leaving ? 'leaving' : 'visible'}
      role={item.tone === 'error' ? 'alert' : 'status'}
    >
      <Icon aria-hidden="true" size={15} strokeWidth={1.5} />
      <span className="notification-chip-label">{item.message}</span>
      <button
        aria-label="Dismiss notification"
        className="notification-chip-dismiss"
        onClick={() => onDismiss(item.id)}
        type="button"
      >
        <X size={15} strokeWidth={1.5} />
      </button>
    </div>
  );
}
