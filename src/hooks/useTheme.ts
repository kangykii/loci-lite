import { useCallback, useEffect, useState } from 'react';
import {
  applyTheme,
  defaultThemeForMode,
  getNotebookTheme,
  resolveTheme,
  resolveThemeDefaults,
  saveThemeDefaults,
  type Theme,
} from '../lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(resolveTheme);
  const [themeDefaults, setThemeDefaults] = useState(resolveThemeDefaults);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => defaultThemeForMode(
      getNotebookTheme(current).mode === 'dark' ? 'light' : 'dark',
      themeDefaults,
    ));
  }, [themeDefaults]);

  const setThemeDefault = useCallback((nextTheme: Theme) => {
    const mode = getNotebookTheme(nextTheme).mode;

    setThemeDefaults((current) => {
      const next = { ...current, [mode]: nextTheme };
      saveThemeDefaults(next);
      return next;
    });
  }, []);

  return { theme, themeDefaults, setTheme, setThemeDefault, toggleTheme };
}
