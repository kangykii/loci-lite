const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);

  if (diff < MINUTE_MS) {
    return 'Just now';
  }

  const minutes = Math.floor(diff / MINUTE_MS);
  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  const hours = Math.floor(diff / HOUR_MS);
  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  const days = Math.floor(diff / DAY_MS);
  if (days < 30) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }

  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

export function formatOpenedAt(openedAtMs: number, nowMs = Date.now()): string {
  const opened = new Date(openedAtMs);
  const now = new Date(nowMs);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfOpened = new Date(opened.getFullYear(), opened.getMonth(), opened.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfOpened.getTime()) / DAY_MS,
  );

  if (dayDiff === 0) {
    return 'Edited today';
  }

  if (dayDiff === 1) {
    return 'Edited yesterday';
  }

  if (dayDiff > 1 && dayDiff < 7) {
    const weekday = opened.toLocaleDateString(undefined, { weekday: 'long' });
    return `Edited ${weekday}`;
  }

  return `Edited ${opened.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: opened.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })}`;
}
