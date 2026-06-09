import { useCallback, useEffect, useState } from 'react';

import { isTauri } from '../lib/tauri';
import {
  EDITOR_FONT_SIZE_DEFAULT,
  EDITOR_FONT_SIZE_MAX,
  EDITOR_FONT_SIZE_MIN,
  getDefaultFontSize,
  setDefaultFontSize,
} from '../store/settings.store';
import { useNotifications } from './useNotifications';

export function useDefaultFontSizeSetting() {
  const { notifySaved } = useNotifications();
  const [fontSize, setFontSizeState] = useState(EDITOR_FONT_SIZE_DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isTauri()) {
      setReady(true);
      return;
    }

    let cancelled = false;

    void getDefaultFontSize()
      .then((size) => {
        if (!cancelled) {
          setFontSizeState(size);
          setReady(true);
        }
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

  const changeFontSize = useCallback(async (next: number) => {
    const clamped = Math.min(
      EDITOR_FONT_SIZE_MAX,
      Math.max(EDITOR_FONT_SIZE_MIN, next),
    );

    setFontSizeState(clamped);

    if (isTauri()) {
      await setDefaultFontSize(clamped);
      notifySaved();
    }
  }, [notifySaved]);

  const stepDown = useCallback(() => {
    void changeFontSize(fontSize - 1);
  }, [changeFontSize, fontSize]);

  const stepUp = useCallback(() => {
    void changeFontSize(fontSize + 1);
  }, [changeFontSize, fontSize]);

  return {
    fontSize,
    ready,
    stepDown,
    stepUp,
    atMin: fontSize <= EDITOR_FONT_SIZE_MIN,
    atMax: fontSize >= EDITOR_FONT_SIZE_MAX,
  };
}
