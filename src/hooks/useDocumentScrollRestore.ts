import { useEffect, useRef } from 'react';
import { getDocumentScrollTarget, getDocumentScrollTop } from '../lib/documentScroll';
import { isTauri } from '../lib/tauri';
import { setDocumentScrollPosition } from '../store/settings.store';

export function useDocumentScrollRestore(fileId: string, isReady: boolean) {
  const saveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    if (!isReady || !isTauri()) {
      return;
    }

    const scrollTarget = getDocumentScrollTarget(document.querySelector(`[data-editor-scroll="${fileId}"]`));

    const savePosition = () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        void setDocumentScrollPosition(fileId, getDocumentScrollTop(scrollTarget));
      }, 250);
    };

    scrollTarget.addEventListener('scroll', savePosition, { passive: true });

    return () => {
      scrollTarget.removeEventListener('scroll', savePosition);
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      void setDocumentScrollPosition(fileId, getDocumentScrollTop(scrollTarget));
    };
  }, [fileId, isReady]);
}
