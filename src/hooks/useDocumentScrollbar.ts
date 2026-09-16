import { useEffect } from 'react';
import { getDocumentScrollTarget } from '../lib/documentScroll';

const IDLE_MS = 800;

export function useDocumentScrollbar(fileId?: string) {
  useEffect(() => {
    const root = fileId
      ? document.querySelector<HTMLElement>(`[data-editor-scroll="${fileId}"]`)
      : document.querySelector<HTMLElement>('[data-editor-scroll]');
    if (!root) return;
    const scrollTarget = getDocumentScrollTarget(root);
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const onScroll = () => {
      root.classList.add('is-scrolling');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        root.classList.remove('is-scrolling');
      }, IDLE_MS);
    };

    scrollTarget.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      scrollTarget.removeEventListener('scroll', onScroll);
      clearTimeout(idleTimer);
      root.classList.remove('is-scrolling');
    };
  }, [fileId]);
}
