export type NotificationTone = 'success' | 'error';

export type NotificationItem = {
  id: string;
  tone: NotificationTone;
  message: string;
  createdAt: number;
};

export type NotifyInput = {
  tone: NotificationTone;
  message: string;
};

export const NOTIFICATION_SUCCESS_MS = 3200;
export const NOTIFICATION_ERROR_MS = 6000;
export const NOTIFICATION_MAX_VISIBLE = 3;

export const NOTIFICATION_LABEL_SAVED = 'Saved';
export const NOTIFICATION_LABEL_BOOKMARK = 'Bookmark';

export function normalizeNotificationMessage(message: string): string {
  return message.trim();
}

export function findCoalescedNotification(
  items: NotificationItem[],
  tone: NotificationTone,
  message: string,
): NotificationItem | undefined {
  const normalized = normalizeNotificationMessage(message);
  return items.find(
    (item) => item.tone === tone && item.message === normalized,
  );
}

export function evictNotificationForOverflow(items: NotificationItem[]): NotificationItem[] {
  if (items.length < NOTIFICATION_MAX_VISIBLE) {
    return items;
  }

  let oldestSuccessIndex = -1;
  let oldestSuccessAt = Number.POSITIVE_INFINITY;

  items.forEach((item, index) => {
    if (item.tone !== 'success') {
      return;
    }

    if (item.createdAt < oldestSuccessAt) {
      oldestSuccessAt = item.createdAt;
      oldestSuccessIndex = index;
    }
  });

  if (oldestSuccessIndex >= 0) {
    return items.filter((_, index) => index !== oldestSuccessIndex);
  }

  return items.slice(0, -1);
}

export function autoDismissMsForTone(tone: NotificationTone): number {
  return tone === 'error' ? NOTIFICATION_ERROR_MS : NOTIFICATION_SUCCESS_MS;
}
