import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EDITOR_FONT_SIZE_DEFAULT,
  EDITOR_FONT_SIZE_MAX,
  EDITOR_FONT_SIZE_MIN,
  getFontSize,
  setFontSize,
} from '../store/settings.store';
import { markFeatureLearned } from '../store/onboarding.store';

export type BarMode = 'idle' | 'find';

const FONT_LABEL_DURATION = 2000;

function countMatches(text: string, query: string): number {
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;

  const haystack = text.toLowerCase();
  let total = 0;
  let index = haystack.indexOf(needle);

  while (index !== -1) {
    total += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return total;
}

export function useBottomBar(fileId: string, editorText: string) {
  const [fontSize, setFontSizeState] = useState(EDITOR_FONT_SIZE_DEFAULT);
  const [fontSizeVisible, setFontSizeVisible] = useState(false);
  const [mode, setMode] = useState<BarMode>('idle');
  const [query, setQueryState] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [findFocusTick, setFindFocusTick] = useState(0);
  const fontTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordCount = useMemo(() => {
    const text = editorText.trim();
    return text === '' ? 0 : text.split(/\s+/).length;
  }, [editorText]);

  const matchTotal = useMemo(() => countMatches(editorText, query), [editorText, query]);

  useEffect(() => {
    if (!fileId) return;
    void getFontSize(fileId).then((size) => setFontSizeState(size));
  }, [fileId]);

  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-size-override', `${fontSize}px`);
  }, [fontSize]);

  useEffect(() => {
    setMatchIndex((current) => Math.min(current, Math.max(matchTotal - 1, 0)));
  }, [matchTotal]);

  useEffect(() => () => {
    if (fontTimerRef.current) clearTimeout(fontTimerRef.current);
  }, []);

  const showFontSize = useCallback(() => {
    setFontSizeVisible(true);

    if (fontTimerRef.current) clearTimeout(fontTimerRef.current);

    fontTimerRef.current = setTimeout(() => setFontSizeVisible(false), FONT_LABEL_DURATION);
  }, []);

  const persistFontSize = useCallback(
    (next: number) => {
      setFontSizeState(next);
      showFontSize();

      if (fileId) void setFontSize(fileId, next);
    },
    [fileId, showFontSize],
  );

  const arrowUp = useCallback(() => {
    if (mode === 'find') {
      if (matchTotal === 0) return;

      setMatchIndex((current) => Math.min(current + 1, matchTotal - 1));
      return;
    }

    persistFontSize(Math.min(fontSize + 1, EDITOR_FONT_SIZE_MAX));
  }, [fontSize, matchTotal, mode, persistFontSize]);

  const arrowDown = useCallback(() => {
    if (mode === 'find') {
      if (matchTotal === 0) return;

      setMatchIndex((current) => Math.max(current - 1, 0));
      return;
    }

    persistFontSize(Math.max(fontSize - 1, EDITOR_FONT_SIZE_MIN));
  }, [fontSize, matchTotal, mode, persistFontSize]);

  const openFind = useCallback(() => {
    void markFeatureLearned('find');
    setFindFocusTick((tick) => tick + 1);
  }, []);

  const closeFind = useCallback(() => {
    setMode('idle');
    setQueryState('');
    setReplacement('');
    setMatchIndex(0);
  }, []);

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    setMatchIndex(0);
    setMode(value.trim() === '' ? 'idle' : 'find');
  }, []);

  const centreLabel = useMemo(() => {
    if (mode === 'find') {
      return matchTotal === 0 ? '0 results' : `${matchIndex + 1} / ${matchTotal}`;
    }

    return fontSizeVisible ? `${fontSize}` : `${wordCount}w`;
  }, [fontSize, fontSizeVisible, matchIndex, matchTotal, mode, wordCount]);

  return {
    arrowsDisabled: mode === 'find' && matchTotal === 0,
    findFocusTick,
    fontSize,
    fontSizeVisible,
    mode,
    query,
    replacement,
    matchIndex,
    matchTotal,
    wordCount,
    centreLabel,
    arrowUp,
    arrowDown,
    openFind,
    closeFind,
    setQuery,
    setReplacement,
  };
}
