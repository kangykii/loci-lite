import { useEffect, useState } from 'react';
import { applyTheme, resolveTheme, type Theme } from '../lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(resolveTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}
