import { useCallback, useEffect, useState } from 'react';

import { isTauri } from '../lib/tauri';
import { initDb } from '../store/db';
import {
  getLocalProfile,
  setLocalProfile,
  type LocalProfile,
} from '../store/settings.store';
import { useNotifications } from './useNotifications';

const emptyProfile: LocalProfile = { name: '', bio: '' };

export function useLocalProfile() {
  const { notifyError, notifySaved } = useNotifications();
  const [profile, setProfile] = useState<LocalProfile>(emptyProfile);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isTauri()) {
      setReady(true);
      return;
    }

    let cancelled = false;
    void initDb()
      .then(() => getLocalProfile())
      .then((next) => {
        if (!cancelled) {
          setProfile(next);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
          notifyError('Could not load your profile');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [notifyError]);

  const saveProfile = useCallback(async (next: LocalProfile): Promise<boolean> => {
    const normalized = { name: next.name.trim(), bio: next.bio.trim() };
    setProfile(normalized);

    if (!isTauri()) {
      notifySaved();
      return true;
    }

    try {
      await setLocalProfile(normalized);
      notifySaved();
      return true;
    } catch {
      notifyError('Could not save your profile');
      return false;
    }
  }, [notifyError, notifySaved]);

  return { profile, ready, saveProfile };
}
