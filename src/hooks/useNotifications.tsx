import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import NotificationHost from '../components/shell/NotificationHost';
import {
  NOTIFICATION_LABEL_BOOKMARK,
  NOTIFICATION_LABEL_SAVED,
  NOTIFICATION_MAX_VISIBLE,
  autoDismissMsForTone,
  evictNotificationForOverflow,
  findCoalescedNotification,
  normalizeNotificationMessage,
  type NotificationItem,
  type NotificationTone,
  type NotifyInput,
} from '../lib/notifications';

const LEAVE_MS = 180;

type NotificationContextValue = {
  dismiss: (id: string) => void;
  notify: (input: NotifyInput) => void;
  notifyBookmark: () => void;
  notifyError: (message: string) => void;
  notifySaved: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function createNotificationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [leavingIds, setLeavingIds] = useState<Set<string>>(() => new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const leaveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const removeItem = useCallback(
    (id: string) => {
      clearTimer(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setLeavingIds((current) => {
        if (!current.has(id)) {
          return current;
        }

        const next = new Set(current);
        next.delete(id);
        return next;
      });
    },
    [clearTimer],
  );

  const scheduleAutoDismiss = useCallback(
    (id: string, tone: NotificationTone) => {
      clearTimer(id);
      const timer = setTimeout(() => {
        timersRef.current.delete(id);
        setLeavingIds((current) => new Set(current).add(id));
        const leaveTimer = setTimeout(() => {
          leaveTimersRef.current.delete(id);
          removeItem(id);
        }, LEAVE_MS);
        leaveTimersRef.current.set(id, leaveTimer);
      }, autoDismissMsForTone(tone));
      timersRef.current.set(id, timer);
    },
    [clearTimer, removeItem],
  );

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setLeavingIds((current) => new Set(current).add(id));
      const leaveTimer = setTimeout(() => {
        leaveTimersRef.current.delete(id);
        removeItem(id);
      }, LEAVE_MS);
      leaveTimersRef.current.set(id, leaveTimer);
    },
    [clearTimer, removeItem],
  );

  const notify = useCallback(
    ({ tone, message }: NotifyInput) => {
      const normalized = normalizeNotificationMessage(message);
      if (!normalized) {
        return;
      }

      setItems((current) => {
        const existing = findCoalescedNotification(current, tone, normalized);
        if (existing) {
          scheduleAutoDismiss(existing.id, tone);
          return current;
        }

        const nextItem: NotificationItem = {
          id: createNotificationId(),
          tone,
          message: normalized,
          createdAt: Date.now(),
        };

        let next = current;
        if (next.length >= NOTIFICATION_MAX_VISIBLE) {
          const evicted = evictNotificationForOverflow(next);
          next
            .filter((item) => !evicted.some((entry) => entry.id === item.id))
            .forEach((item) => clearTimer(item.id));
          next = evicted;
        }

        next = [nextItem, ...next].slice(0, NOTIFICATION_MAX_VISIBLE);
        scheduleAutoDismiss(nextItem.id, tone);
        return next;
      });
    },
    [clearTimer, scheduleAutoDismiss],
  );

  const notifySaved = useCallback(() => {
    notify({ tone: 'success', message: NOTIFICATION_LABEL_SAVED });
  }, [notify]);

  const notifyBookmark = useCallback(() => {
    notify({ tone: 'success', message: NOTIFICATION_LABEL_BOOKMARK });
  }, [notify]);

  const notifyError = useCallback(
    (message: string) => {
      notify({ tone: 'error', message });
    },
    [notify],
  );

  useEffect(() => {
    const autoTimers = timersRef.current;
    const leaveTimers = leaveTimersRef.current;

    return () => {
      autoTimers.forEach((timer) => clearTimeout(timer));
      autoTimers.clear();
      leaveTimers.forEach((timer) => clearTimeout(timer));
      leaveTimers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      dismiss,
      notify,
      notifyBookmark,
      notifyError,
      notifySaved,
    }),
    [dismiss, notify, notifyBookmark, notifyError, notifySaved],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationHost items={items} leavingIds={leavingIds} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return context;
}
