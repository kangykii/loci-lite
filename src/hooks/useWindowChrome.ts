import { useCallback, useEffect, useState, type MouseEvent } from 'react';

import {
  closeWindow,
  isWindowMaximized,
  minimizeWindow,
  onWindowResized,
  startWindowDrag,
  toggleMaximizeWindow,
} from '../lib/tauri';

export function useWindowChrome() {
  const [isMaximized, setIsMaximized] = useState(false);

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
    };
  }, []);

  const refreshMaximized = useCallback(() => {
    void isWindowMaximized().then(setIsMaximized);
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
    handleToggleMaximize,
    isMaximized,
  };
}
