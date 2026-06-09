import { useEffect, useState } from 'react';
import { isTauri } from '../lib/tauri';
import { getDocumentScrollPosition } from '../store/settings.store';

// Hide editor bar until document scroll is restored; defer html scroll root switch.
export function useEditorChromeEntry(fileId: string, documentReady: boolean) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    setIsRevealed(false);
    document.body.classList.add('chrome-offstage');
    document.documentElement.classList.remove('editor-revealed');
    window.scrollTo({ top: 0, behavior: 'instant' });

    return () => {
      document.body.classList.remove('chrome-offstage');
      document.documentElement.classList.remove('editor-revealed');
      setIsRevealed(false);
    };
  }, [fileId]);

  useEffect(() => {
    if (!documentReady) {
      return;
    }

    if (!isTauri()) {
      setIsRevealed(true);
      document.documentElement.classList.add('editor-revealed');
      document.body.classList.remove('chrome-offstage');
      return;
    }

    let cancelled = false;
    let outerId = 0;
    let innerId = 0;

    void (async () => {
      const scrollY = await getDocumentScrollPosition(fileId);

      if (cancelled) {
        return;
      }

      outerId = requestAnimationFrame(() => {
        if (scrollY !== null) {
          window.scrollTo({ top: scrollY, behavior: 'instant' });
        }

        innerId = requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }

          document.documentElement.classList.add('editor-revealed');
          document.body.classList.remove('chrome-offstage');
          setIsRevealed(true);
        });
      });
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(outerId);
      cancelAnimationFrame(innerId);
    };
  }, [documentReady, fileId]);

  return isRevealed;
}
