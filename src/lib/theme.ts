export type ThemeMode = 'light' | 'dark';
export type Theme = 'default_white' | 'default_dark' | 'anthracite_grey' | 'ochre_black';
export type ThemeDefaults = Record<ThemeMode, Theme>;

export type NotebookTheme = {
  id: Theme;
  name: string;
  description: string;
  mode: ThemeMode;
  coverClass: string;
};

export const notebookThemes: NotebookTheme[] = [
  {
    id: 'default_white',
    name: 'Default White',
    description: 'Warm paper, clean margins.',
    mode: 'light',
    coverClass: 'settings-theme-cover--default-white',
  },
  {
    id: 'default_dark',
    name: 'Default Dark',
    description: 'Charcoal cover, late-night pages.',
    mode: 'dark',
    coverClass: 'settings-theme-cover--default-dark',
  },
  {
    id: 'anthracite_grey',
    name: 'Anthracite Grey',
    description: 'A pale grey desk with graphite edges.',
    mode: 'light',
    coverClass: 'settings-theme-cover--anthracite-grey',
  },
  {
    id: 'ochre_black',
    name: 'Ochre Black',
    description: 'Blackened paper with an ochre glow.',
    mode: 'dark',
    coverClass: 'settings-theme-cover--ochre-black',
  },
];

const storageKey = 'loci-lite-theme';
const defaultsStorageKey = 'loci-lite-theme-defaults';
const legacyThemeMap: Record<'light' | 'dark', Theme> = {
  light: 'default_white',
  dark: 'default_dark',
};

const builtInThemeDefaults: ThemeDefaults = {
  light: 'default_white',
  dark: 'default_dark',
};

export function isTheme(value: string | null): value is Theme {
  return notebookThemes.some((theme) => theme.id === value);
}

export function getNotebookTheme(theme: Theme): NotebookTheme {
  return notebookThemes.find((entry) => entry.id === theme) ?? notebookThemes[0];
}

export function resolveTheme(): Theme {
  const stored = localStorage.getItem(storageKey);
  if (isTheme(stored)) {
    return stored;
  }
  if (stored === 'light' || stored === 'dark') {
    return legacyThemeMap[stored];
  }
  return 'default_white';
}

function isThemeForMode(value: unknown, mode: ThemeMode): value is Theme {
  return typeof value === 'string' && isTheme(value) && getNotebookTheme(value).mode === mode;
}

export function resolveThemeDefaults(): ThemeDefaults {
  const stored = localStorage.getItem(defaultsStorageKey);

  if (!stored) {
    return builtInThemeDefaults;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (parsed && typeof parsed === 'object') {
      const candidate = parsed as Partial<ThemeDefaults>;
      return {
        light: isThemeForMode(candidate.light, 'light') ? candidate.light : builtInThemeDefaults.light,
        dark: isThemeForMode(candidate.dark, 'dark') ? candidate.dark : builtInThemeDefaults.dark,
      };
    }
  } catch {
    // Invalid local preference data should never prevent the app from starting.
  }

  return builtInThemeDefaults;
}

export function saveThemeDefaults(defaults: ThemeDefaults): void {
  localStorage.setItem(defaultsStorageKey, JSON.stringify(defaults));
}

export function applyTheme(theme: Theme) {
  const notebookTheme = getNotebookTheme(theme);
  document.documentElement.dataset.theme = notebookTheme.mode;
  document.documentElement.dataset.notebookTheme = notebookTheme.id;
  localStorage.setItem(storageKey, theme);
}

export function defaultThemeForMode(mode: ThemeMode, defaults = resolveThemeDefaults()): Theme {
  return defaults[mode];
}
