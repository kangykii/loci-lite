import { useCallback, useEffect, useState } from 'react';
import { applyTheme, defaultThemeForMode, getNotebookTheme, resolveTheme, type Theme } from '../lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(resolveTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => defaultThemeForMode(getNotebookTheme(current).mode === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
