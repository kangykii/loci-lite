import { useEffect, useState } from 'react';

import { writeWelcomeMessages } from '../ai/actions/writeWelcomeMessages';
import { latestWritingSource } from '../lib/aiWelcomeSource';
import {
  getAmbientGreeting,
  getTimeOfDay,
  selectLetter,
} from '../lib/fallbackLetters';
import { isTauri } from '../lib/tauri';
import {
  getDaysSinceInstall,
  getLearnedFeatures,
  initInstallDate,
} from '../store/onboarding.store';
import {
  getAiWelcomeCache,
  getOpenAIKey,
  setAiWelcomeCache,
} from '../store/settings.store';
import { useNotifications } from './useNotifications';

type AiWelcomeStatus = 'loading' | 'ready' | 'missing-key' | 'error';

type AiWelcomeState = {
  message: string;
  greeting: string | null;
  sign: string | null;
  status: AiWelcomeStatus;
};

async function loadFallbackState(): Promise<AiWelcomeState> {
  const [daysSinceInstall, learnedFeatures] = await Promise.all([
    getDaysSinceInstall(),
    getLearnedFeatures(),
  ]);
  const letter = selectLetter(
    daysSinceInstall,
    new Set(learnedFeatures),
    getTimeOfDay(),
  );

  return {
    message: letter.body,
    greeting: letter.greeting,
    sign: letter.sign,
    status: 'ready',
  };
}

function createAmbientFallbackState(): AiWelcomeState {
  return {
    message: getAmbientGreeting(),
    greeting: null,
    sign: null,
    status: 'ready',
  };
}

export function useAiWelcomeMessages() {
  const { notifyError } = useNotifications();
  const [state, setState] = useState<AiWelcomeState>({
    message: '',
    greeting: null,
    sign: null,
    status: 'loading',
  });

  useEffect(() => {
    if (!isTauri()) {
      setState(createAmbientFallbackState());
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        await initInstallDate();
        const fallbackState = await loadFallbackState();

        const cache = await getAiWelcomeCache();
        const cachedMessage = cache.messages[cache.index];

        if (cachedMessage) {
          if (!cancelled) {
            setState({
              message: cachedMessage,
              greeting: null,
              sign: null,
              status: 'ready',
            });
          }

          await setAiWelcomeCache({ ...cache, index: cache.index + 1 });
          return;
        }

        const apiKey = await getOpenAIKey();
        if (!apiKey) {
          if (!cancelled) {
            setState({ ...fallbackState, status: 'missing-key' });
          }
          return;
        }

        const source = await latestWritingSource();
        const result = await writeWelcomeMessages({
          apiKey,
          markdown: source.markdown,
          title: source.title,
        });

        const firstMessage = result.messages[0] ?? fallbackState.message;
        await setAiWelcomeCache({
          messages: result.messages,
          index: 1,
          sourceFileId: source.fileId,
        });

        if (!cancelled) {
          setState({
            message: firstMessage,
            greeting: null,
            sign: null,
            status: 'ready',
          });
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          const message =
            cause instanceof Error ? cause.message : 'Failed to generate welcome message.';
          notifyError(message);
          setState({ ...createAmbientFallbackState(), status: 'error' });
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [notifyError]);

  return state;
}
