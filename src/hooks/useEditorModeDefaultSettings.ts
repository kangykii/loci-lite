import { useCallback, useEffect, useState } from 'react';

import { isTauri } from '../lib/tauri';
import {
  getDefaultBookmarkHighlight,
  getDefaultFocusMode,
  setDefaultBookmarkHighlight,
  setDefaultFocusMode,
} from '../store/settings.store';
import { useNotifications } from './useNotifications';

export function useEditorModeDefaultSettings() {
  const { notifySaved } = useNotifications();
  const [focusMode, setFocusMode] = useState(false);
  const [bookmarkHighlight, setBookmarkHighlight] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isTauri()) {
      setReady(true);
      return;
    }

    let cancelled = false;

    void Promise.all([
      getDefaultFocusMode(),
      getDefaultBookmarkHighlight(),
    ])
      .then(([focus, bookmarkOn]) => {
        if (cancelled) return;

        setFocusMode(focus);
        setBookmarkHighlight(bookmarkOn);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFocusMode = useCallback(async (enabled: boolean) => {
    setFocusMode(enabled);

    if (isTauri()) {
      await setDefaultFocusMode(enabled);
      notifySaved();
    }
  }, [notifySaved]);

  const toggleBookmarkHighlight = useCallback(async (enabled: boolean) => {
    setBookmarkHighlight(enabled);

    if (isTauri()) {
      await setDefaultBookmarkHighlight(enabled);
      notifySaved();
    }
  }, [notifySaved]);

  return {
    bookmarkHighlight,
    focusMode,
    ready,
    toggleBookmarkHighlight,
    toggleFocusMode,
  };
}
