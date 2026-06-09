import { useEffect } from 'react';

const IDLE_MS = 800;

export function useDocumentScrollbar() {
  useEffect(() => {
    const root = document.documentElement;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const onScroll = () => {
      root.classList.add('is-scrolling');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        root.classList.remove('is-scrolling');
      }, IDLE_MS);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(idleTimer);
      root.classList.remove('is-scrolling');
    };
  }, []);
}
