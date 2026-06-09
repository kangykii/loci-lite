import { useCallback, useEffect, useState } from 'react';

import { isTauri } from '../lib/tauri';
import { getOpenAIKey, setOpenAIKey } from '../store/settings.store';
import { useNotifications } from './useNotifications';

export function useOpenAIKeySetting() {
  const { notifyError, notifySaved } = useNotifications();
  const [apiKey, setApiKeyState] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauri()) {
      setReady(true);
      return;
    }

    let cancelled = false;

    void getOpenAIKey()
      .then((storedKey) => {
        if (!cancelled) {
          setApiKeyState(storedKey);
          setReady(true);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          const message = cause instanceof Error ? cause.message : 'Failed to load OpenAI key';
          setError(message);
          notifyError(message);
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [notifyError]);

  const setApiKey = useCallback(
    async (nextKey: string) => {
      setApiKeyState(nextKey);
      setError(null);

      if (!isTauri()) {
        return;
      }

      try {
        await setOpenAIKey(nextKey);
        notifySaved();
      } catch (cause: unknown) {
        const message = cause instanceof Error ? cause.message : 'Failed to save OpenAI key';
        setError(message);
        notifyError(message);
      }
    },
    [notifyError, notifySaved],
  );

  return { apiKey, error, ready, setApiKey };
}
