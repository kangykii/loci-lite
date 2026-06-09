import { useCallback, useEffect, useState, type RefObject } from 'react';

import { isTauri } from '../lib/tauri';
import { getDefaultAuthorship } from '../store/settings.store';

export function useAuthorshipMode(
  editorRootRef: RefObject<HTMLDivElement | null>,
  fileId: string,
) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!fileId || !isTauri()) return;

    let cancelled = false;

    void getDefaultAuthorship().then((enabled) => {
      if (!cancelled) setIsActive(enabled);
    });

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const toggle = useCallback(() => setIsActive((value) => !value), []);

  useEffect(() => {
    const element = editorRootRef.current;
    if (!element) {
      return;
    }

    element.classList.toggle('authorship-visible', isActive);
  }, [editorRootRef, isActive]);

  return { isActive, toggle };
}
