import { useEffect, useRef } from 'react';
import {
  accumulateHorizontalWheel,
  createGestureAccumulator,
  GESTURE_COOLDOWN_MS,
  GESTURE_COMMIT_NAV,
  GESTURE_COMMIT_OPEN,
  isHorizontalWheelEvent,
  resetGestureAccumulator,
  isBlockedTarget,
  hasTextSelection,
} from '../lib/shellSidebarGesture';
import type { ViewName } from './useViewTransition';

type ShellSidebarGestureOptions = {
  activeView: ViewName;
  isGestureLocked: boolean;
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
  onCloseSidebar: () => void;
  onGoHome: () => void;
  onOpenLastDocument: () => void;
};

export function useShellSidebarGesture({
  activeView,
  isGestureLocked,
  isSidebarOpen,
  onOpenSidebar,
  onCloseSidebar,
  onGoHome,
  onOpenLastDocument,
}: ShellSidebarGestureOptions) {
  const cooldownUntilRef = useRef(0);
  const accumRef = useRef(createGestureAccumulator());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;

      if (!mod || !event.shiftKey || event.repeat || event.key.toLowerCase() !== 'l') {
        return;
      }

      if (isBlockedTarget(event.target)) {
        return;
      }

      event.preventDefault();
      resetGestureAccumulator(accumRef.current);
      if (isSidebarOpen) {
        onCloseSidebar();
      } else {
        onOpenSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      resetGestureAccumulator(accumRef.current);
    };
  }, [isSidebarOpen, onCloseSidebar, onOpenSidebar]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const now = window.performance.now();

      if (now < cooldownUntilRef.current || isGestureLocked) {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        resetGestureAccumulator(accumRef.current);
        return;
      }
      if (isBlockedTarget(event.target) || hasTextSelection()) {
        resetGestureAccumulator(accumRef.current);
        return;
      }
      if (!isHorizontalWheelEvent(event.deltaX, event.deltaY)) {
        resetGestureAccumulator(accumRef.current);
        return;
      }

      const direction = accumulateHorizontalWheel(
        accumRef.current,
        event.deltaX,
        event.deltaY,
        now,
      );
      if (!direction) {
        return;
      }

      const threshold = direction === 'right' ? GESTURE_COMMIT_OPEN : GESTURE_COMMIT_NAV;

      event.preventDefault();

      if (accumRef.current.sum < threshold) {
        return;
      }

      cooldownUntilRef.current = now + GESTURE_COOLDOWN_MS;
      resetGestureAccumulator(accumRef.current);

      if (direction === 'right') {
        onOpenSidebar();
        return;
      }

      if (isSidebarOpen) {
        onCloseSidebar();
        return;
      }

      if (activeView === 'home') {
        onOpenLastDocument();
      } else {
        onGoHome();
      }
    };

    window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
      resetGestureAccumulator(accumRef.current);
    };
  }, [
    activeView,
    isGestureLocked,
    isSidebarOpen,
    onCloseSidebar,
    onGoHome,
    onOpenLastDocument,
    onOpenSidebar,
  ]);
}
