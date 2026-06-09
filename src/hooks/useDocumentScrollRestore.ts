import { useEffect, useRef } from 'react';
import { isTauri } from '../lib/tauri';
import { setDocumentScrollPosition } from '../store/settings.store';

export function useDocumentScrollRestore(fileId: string, isReady: boolean) {
  const saveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    if (!isReady || !isTauri()) {
      return;
    }

    const savePosition = () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        void setDocumentScrollPosition(fileId, window.scrollY);
      }, 250);
    };

    window.addEventListener('scroll', savePosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', savePosition);
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      void setDocumentScrollPosition(fileId, window.scrollY);
    };
  }, [fileId, isReady]);
}
