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
