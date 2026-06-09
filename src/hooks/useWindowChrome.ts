import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';

import {
  closeWindow,
  isWindowMaximized,
  minimizeWindow,
  onWindowResized,
  startWindowDrag,
  toggleMaximizeWindow,
} from '../lib/tauri';

const WINDOW_CHROME_HIDE_MS = 250;

export function useWindowChrome() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void isWindowMaximized().then(setIsMaximized);
    void onWindowResized(() => {
      void isWindowMaximized().then(setIsMaximized);
    }).then((dispose) => {
      unlisten = dispose;
    });

    return () => {
      unlisten?.();
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const refreshMaximized = useCallback(() => {
    void isWindowMaximized().then(setIsMaximized);
  }, []);

  const handleRevealEnter = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsRevealed(true);
  }, []);

  const handleRevealLeave = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setIsRevealed(false);
      hideTimerRef.current = null;
    }, WINDOW_CHROME_HIDE_MS);
  }, []);

  const handleClose = useCallback(() => {
    void closeWindow();
  }, []);

  const handleMinimize = useCallback(() => {
    void minimizeWindow();
  }, []);

  const handleToggleMaximize = useCallback(() => {
    void toggleMaximizeWindow().then(refreshMaximized);
  }, [refreshMaximized]);

  const handleDragMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.buttons !== 1) {
        return;
      }

      if (event.detail === 2) {
        void toggleMaximizeWindow().then(refreshMaximized);
        return;
      }

      void startWindowDrag();
    },
    [refreshMaximized],
  );

  return {
    handleClose,
    handleDragMouseDown,
    handleMinimize,
    handleRevealEnter,
    handleRevealLeave,
    handleToggleMaximize,
    isMaximized,
    isRevealed,
  };
}
