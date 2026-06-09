import { useCallback, useEffect, useState } from 'react';

import { isTauri } from '../lib/tauri';
import { getTypewriterSound, setTypewriterSound } from '../store/settings.store';
import { useNotifications } from './useNotifications';

export function useTypewriterSoundSetting() {
  const { notifySaved } = useNotifications();
  const [soundOn, setSoundOn] = useState(false);
  const [soundReady, setSoundReady] = useState(false);

  useEffect(() => {
    if (!isTauri()) {
      setSoundReady(true);
      return;
    }

    let cancelled = false;

    void getTypewriterSound()
      .then((enabled) => {
        if (!cancelled) {
          setSoundOn(enabled);
          setSoundReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSoundReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSound = useCallback(async (enabled: boolean) => {
    setSoundOn(enabled);

    if (isTauri()) {
      await setTypewriterSound(enabled);
      notifySaved();
    }
  }, [notifySaved]);

  return { soundOn, soundReady, toggleSound };
}
