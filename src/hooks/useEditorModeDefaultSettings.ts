import { useCallback, useEffect, useState } from 'react';

import { isTauri } from '../lib/tauri';
import {
  getDefaultAuthorship,
  getDefaultBookmarkHighlight,
  getDefaultFocusMode,
  setDefaultAuthorship,
  setDefaultBookmarkHighlight,
  setDefaultFocusMode,
} from '../store/settings.store';
import { useNotifications } from './useNotifications';

export function useEditorModeDefaultSettings() {
  const { notifySaved } = useNotifications();
  const [focusMode, setFocusMode] = useState(false);
  const [authorship, setAuthorship] = useState(false);
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
      getDefaultAuthorship(),
      getDefaultBookmarkHighlight(),
    ])
      .then(([focus, authorshipOn, bookmarkOn]) => {
        if (cancelled) return;

        setFocusMode(focus);
        setAuthorship(authorshipOn);
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

  const toggleAuthorship = useCallback(async (enabled: boolean) => {
    setAuthorship(enabled);

    if (isTauri()) {
      await setDefaultAuthorship(enabled);
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
    authorship,
    bookmarkHighlight,
    focusMode,
    ready,
    toggleAuthorship,
    toggleBookmarkHighlight,
    toggleFocusMode,
  };
}
