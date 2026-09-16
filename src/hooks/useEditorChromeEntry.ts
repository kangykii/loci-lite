import { useEffect, useRef, useState } from 'react';
import { getDocumentScrollTarget, scrollDocumentTo } from '../lib/documentScroll';
import { isTauri } from '../lib/tauri';
import { getDocumentScrollPosition } from '../store/settings.store';

// Hide editor bar until document scroll is restored; defer html scroll root switch.
// `skipScrollRestore` (typewriter mode) opts out of applying the saved scroll
// offset — TypewriterScrollPlugin owns positioning in that case, and restoring
// a stale saved position here races it and can silently overwrite the caret
// lock right after it was set.
export function useEditorChromeEntry(
  fileId: string,
  documentReady: boolean,
  skipScrollRestore = false,
  splitMode = false,
) {
  const [isRevealed, setIsRevealed] = useState(false);
  const scrollPositionRef = useRef<Promise<number | null> | null>(null);

  // Kick off the scroll-position lookup as soon as the note is known, in
  // parallel with useDocument's own fetch, instead of waiting for `ready`
  // and adding a trailing IPC round trip to the reveal path.
  useEffect(() => {
    setIsRevealed(false);
    if (!splitMode) {
      document.body.classList.add('chrome-offstage');
      document.documentElement.classList.remove('editor-revealed');
    }
    const editorScroll = document.querySelector(`[data-editor-scroll="${fileId}"]`);
    scrollDocumentTo(0, getDocumentScrollTarget(editorScroll));

    scrollPositionRef.current =
      skipScrollRestore || !isTauri() ? null : getDocumentScrollPosition(fileId);

    return () => {
      if (!splitMode) {
        document.body.classList.remove('chrome-offstage');
        document.documentElement.classList.remove('editor-revealed');
      }
      setIsRevealed(false);
    };
  }, [fileId, skipScrollRestore, splitMode]);

  useEffect(() => {
    if (!documentReady) {
      return;
    }

    if (!isTauri()) {
      setIsRevealed(true);
      if (!splitMode) {
        document.documentElement.classList.add('editor-revealed');
        document.body.classList.remove('chrome-offstage');
      }
      return;
    }

    let cancelled = false;
    let outerId = 0;
    let innerId = 0;

    void (async () => {
      const scrollY = skipScrollRestore ? null : await scrollPositionRef.current;

      if (cancelled) {
        return;
      }

      outerId = requestAnimationFrame(() => {
        if (scrollY !== null) {
          const editorScroll = document.querySelector(`[data-editor-scroll="${fileId}"]`);
          scrollDocumentTo(scrollY, getDocumentScrollTarget(editorScroll));
        }

        innerId = requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }

          if (!splitMode) {
            document.documentElement.classList.add('editor-revealed');
            document.body.classList.remove('chrome-offstage');
          }
          setIsRevealed(true);
        });
      });
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(outerId);
      cancelAnimationFrame(innerId);
    };
  }, [documentReady, fileId, skipScrollRestore, splitMode]);

  return isRevealed;
}
