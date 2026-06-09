import { useCallback, useEffect, useState, type RefObject } from 'react';

import { isTauri } from '../lib/tauri';
import { getDefaultFocusMode } from '../store/settings.store';

export function useFocusMode(
  editorRootRef: RefObject<HTMLDivElement | null>,
  fileId: string,
) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!fileId || !isTauri()) return;

    let cancelled = false;

    void getDefaultFocusMode().then((enabled) => {
      if (!cancelled) setIsActive(enabled);
    });

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const enter = useCallback(() => setIsActive(true), []);
  const exit = useCallback(() => setIsActive(false), []);
  const toggle = useCallback(() => setIsActive((value) => !value), []);

  useEffect(() => {
    const element = editorRootRef.current;
    if (!element) {
      return;
    }

    element.classList.toggle('focus-active', isActive);
  }, [isActive, editorRootRef]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      exit();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exit, isActive]);

  return { isActive, enter, exit, toggle };
}
