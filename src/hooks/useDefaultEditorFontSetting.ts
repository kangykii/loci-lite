import { useCallback, useEffect, useState } from 'react';

import {
  applyEditorFont,
  EDITOR_FONT_DEFAULT,
  type EditorFontChoice,
} from '../lib/editorFont';
import { isTauri } from '../lib/tauri';
import { initDb } from '../store/db';
import { getDefaultEditorFont, setDefaultEditorFont } from '../store/settings.store';
import { useNotifications } from './useNotifications';

export function useDefaultEditorFontSetting() {
  const { notifySaved } = useNotifications();
  const [fontChoice, setFontChoice] = useState<EditorFontChoice>(EDITOR_FONT_DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isTauri()) {
      applyEditorFont(EDITOR_FONT_DEFAULT);
      setReady(true);
      return;
    }

    let cancelled = false;

    void initDb()
      .then(() => getDefaultEditorFont())
      .then((choice) => {
        if (cancelled) {
          return;
        }

        setFontChoice(choice);
        applyEditorFont(choice);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          applyEditorFont(EDITOR_FONT_DEFAULT);
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectFont = useCallback(async (choice: EditorFontChoice) => {
    setFontChoice(choice);
    applyEditorFont(choice);

    if (isTauri()) {
      await initDb();
      await setDefaultEditorFont(choice);
      notifySaved();
    }
  }, [notifySaved]);

  return {
    fontChoice,
    ready,
    selectFont,
  };
}
