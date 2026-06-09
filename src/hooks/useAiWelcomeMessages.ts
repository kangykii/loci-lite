import { useEffect, useState } from 'react';

import { writeWelcomeMessages } from '../ai/actions/writeWelcomeMessages';
import { displayTitleForFile } from '../lib/documentMeta';
import { isTauri, readFile } from '../lib/tauri';
import { isLikelyWritingMarkdown } from '../lib/welcomeWritingSource';
import { listFilesByEditedAt } from '../store/files.store';
import {
  getAiWelcomeCache,
  getOpenAIKey,
  setAiWelcomeCache,
} from '../store/settings.store';
import { useNotifications } from './useNotifications';

type AiWelcomeStatus = 'loading' | 'ready' | 'missing-key' | 'error';

type AiWelcomeState = {
  message: string;
  status: AiWelcomeStatus;
};

const FALLBACK_MESSAGE =
  'Start here. Let the page collect the first true sentence, then the next one, until the thought has enough weight to stand on its own.';

async function latestWritingSource(): Promise<{
  fileId: string | null;
  markdown: string;
  title: string;
}> {
  const files = await listFilesByEditedAt();

  for (const file of files) {
    let markdown = '';
    try {
      markdown = await readFile(file.path);
    } catch {
      continue;
    }

    if (isLikelyWritingMarkdown(markdown)) {
      return {
        fileId: file.id,
        markdown,
        title: displayTitleForFile(file.title, file.path),
      };
    }
  }

  return {
    fileId: null,
    markdown: 'No writing-like document was available. Write generic welcome prompts.',
    title: 'Writing desk',
  };
}

export function useAiWelcomeMessages() {
  const { notifyError } = useNotifications();
  const [state, setState] = useState<AiWelcomeState>({
    message: FALLBACK_MESSAGE,
    status: 'loading',
  });

  useEffect(() => {
    if (!isTauri()) {
      setState({ message: FALLBACK_MESSAGE, status: 'ready' });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const cache = await getAiWelcomeCache();
        const cachedMessage = cache.messages[cache.index];

        if (cachedMessage) {
          if (!cancelled) {
            setState({ message: cachedMessage, status: 'ready' });
          }

          await setAiWelcomeCache({ ...cache, index: cache.index + 1 });
          return;
        }

        const apiKey = await getOpenAIKey();
        if (!apiKey) {
          if (!cancelled) {
            notifyError('OpenAI key required for AI welcome.');
            setState({
              message: FALLBACK_MESSAGE,
              status: 'missing-key',
            });
          }
          return;
        }

        const source = await latestWritingSource();
        const result = await writeWelcomeMessages({
          apiKey,
          markdown: source.markdown,
          title: source.title,
        });

        const firstMessage = result.messages[0] ?? FALLBACK_MESSAGE;
        await setAiWelcomeCache({
          messages: result.messages,
          index: 1,
          sourceFileId: source.fileId,
        });

        if (!cancelled) {
          setState({
            message: firstMessage,
            status: 'ready',
          });
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          const message =
            cause instanceof Error ? cause.message : 'Failed to generate welcome message.';
          notifyError(message);
          setState({
            message: FALLBACK_MESSAGE,
            status: 'error',
          });
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
