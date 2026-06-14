export type ThemeMode = 'light' | 'dark';
export type ThemeAccess = 'free' | 'modern_writer';
export type Theme = 'default_white' | 'default_dark' | 'anthracite_grey' | 'ochre_black';

export type NotebookTheme = {
  id: Theme;
  name: string;
  description: string;
  mode: ThemeMode;
  access: ThemeAccess;
  cosmeticSlug?: string;
  coverClass: string;
};

export const notebookThemes: NotebookTheme[] = [
  {
    id: 'default_white',
    name: 'Default White',
    description: 'Warm paper, clean margins.',
    mode: 'light',
    access: 'free',
    coverClass: 'profile-notebook-cover--default-white',
  },
  {
    id: 'default_dark',
    name: 'Default Dark',
    description: 'Charcoal cover, late-night pages.',
    mode: 'dark',
    access: 'free',
    coverClass: 'profile-notebook-cover--default-dark',
  },
  {
    id: 'anthracite_grey',
    name: 'Anthracite Grey',
    description: 'A pale grey desk with graphite edges.',
    mode: 'light',
    access: 'modern_writer',
    cosmeticSlug: 'theme_anthracite_grey',
    coverClass: 'profile-notebook-cover--anthracite-grey',
  },
  {
    id: 'ochre_black',
    name: 'Ochre Black',
    description: 'Blackened paper with an ochre glow.',
    mode: 'dark',
    access: 'modern_writer',
    cosmeticSlug: 'theme_ochre_black',
    coverClass: 'profile-notebook-cover--ochre-black',
  },
];

const storageKey = 'loci-lite-theme';
const legacyThemeMap: Record<'light' | 'dark', Theme> = {
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

export function applyTheme(theme: Theme) {
  const notebookTheme = getNotebookTheme(theme);
  document.documentElement.dataset.theme = notebookTheme.mode;
  document.documentElement.dataset.notebookTheme = notebookTheme.id;
  localStorage.setItem(storageKey, theme);
}

export function defaultThemeForMode(mode: ThemeMode): Theme {
  return mode === 'dark' ? 'default_dark' : 'default_white';
}
