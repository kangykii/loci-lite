export const GESTURE_ACCUM_WINDOW_MS = 480;
export const GESTURE_IDLE_RESET_MS = 140;
export const GESTURE_DOMINANCE_RATIO = 2.2;
export const GESTURE_COMMIT_OPEN = 140;
export const GESTURE_COMMIT_NAV = 180;
export const GESTURE_COOLDOWN_MS = 1100;

export type GestureDirection = 'left' | 'right';

export type GestureAccumulator = {
  sum: number;
  direction: GestureDirection | null;
  lastEventAt: number;
  windowStartedAt: number;
};

export function createGestureAccumulator(): GestureAccumulator {
  return { sum: 0, direction: null, lastEventAt: 0, windowStartedAt: 0 };
}

export function resetGestureAccumulator(state: GestureAccumulator): void {
  state.sum = 0;
  state.direction = null;
  state.lastEventAt = 0;
  state.windowStartedAt = 0;
}

export function isHorizontalWheelEvent(deltaX: number, deltaY: number): boolean {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (absX === 0) return false;
  return absX >= absY * GESTURE_DOMINANCE_RATIO;
}

export function accumulateHorizontalWheel(
  state: GestureAccumulator,
  deltaX: number,
  deltaY: number,
  now: number,
): GestureDirection | null {
  if (!isHorizontalWheelEvent(deltaX, deltaY)) {
    return null;
  }

  const direction: GestureDirection = deltaX < 0 ? 'right' : 'left';

  if (state.lastEventAt > 0 && now - state.lastEventAt > GESTURE_IDLE_RESET_MS) {
    resetGestureAccumulator(state);
  }

  if (state.windowStartedAt === 0 || now - state.windowStartedAt > GESTURE_ACCUM_WINDOW_MS) {
    resetGestureAccumulator(state);
    state.windowStartedAt = now;
  }

  if (state.direction !== null && state.direction !== direction) {
    resetGestureAccumulator(state);
    state.windowStartedAt = now;
  }

  state.direction = direction;
  state.sum += Math.abs(deltaX);
  state.lastEventAt = now;

  return direction;
}

export function isBlockedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest(
      [
        'input',
        'textarea',
        'select',
        '[role="dialog"]',
        '.context-menu-layer',
        '.confirm-dialog-layer',
        '.profile-dialog-layer',
        '.atom-popup-layer',
        '.bookmark-stack-popup-layer',
      ].join(','),
    ),
  );
}

export function hasTextSelection(): boolean {
  return (document.getSelection()?.toString().trim().length ?? 0) > 0;
}

export function setSidebarGestureVisual(
  direction: GestureDirection,
  sum: number,
  threshold: number,
): void {
  const doc = document.documentElement;
  const progress = Math.min(1, sum / threshold);

  doc.setAttribute('data-sidebar-gesture', direction);
  doc.style.setProperty('--sidebar-gesture-progress', progress.toFixed(3));
  doc.style.setProperty('--sidebar-gesture-pull-x', `calc(var(--u) * ${progress.toFixed(3)})`);
}

export function clearSidebarGestureVisual(): void {
  const doc = document.documentElement;
  doc.removeAttribute('data-sidebar-gesture');
  doc.style.removeProperty('--sidebar-gesture-progress');
  doc.style.removeProperty('--sidebar-gesture-pull-x');
}
