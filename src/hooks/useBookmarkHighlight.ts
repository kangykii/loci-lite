import { useCallback, useEffect, useState, type RefObject } from 'react';

import { isTauri } from '../lib/tauri';
import { getDefaultBookmarkHighlight } from '../store/settings.store';

export function useBookmarkHighlight(
  editorRootRef: RefObject<HTMLDivElement | null>,
  fileId: string,
) {
  const [isHighlightOn, setIsHighlightOn] = useState(false);

  useEffect(() => {
    if (!fileId || !isTauri()) return;

    let cancelled = false;

    void getDefaultBookmarkHighlight().then((enabled) => {
      if (!cancelled) setIsHighlightOn(enabled);
    });

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const enable = useCallback(() => setIsHighlightOn(true), []);
  const disable = useCallback(() => setIsHighlightOn(false), []);
  const toggle = useCallback(() => setIsHighlightOn((value) => !value), []);

  useEffect(() => {
    const element = editorRootRef.current;
    if (!element) {
      return;
    }

    element.classList.toggle('bookmark-highlight-on', isHighlightOn);
  }, [editorRootRef, isHighlightOn]);

  return { isHighlightOn, enable, disable, toggle };
}
