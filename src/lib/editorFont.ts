export type EditorFontChoice = 'classic' | 'modern' | 'typewriter';

export const EDITOR_FONT_DEFAULT: EditorFontChoice = 'classic';

export const EDITOR_FONT_OPTIONS: ReadonlyArray<{
  id: EditorFontChoice;
  label: string;
  family: string;
}> = [
  {
    id: 'classic',
    label: 'Classic',
    family: '"Newsreader", Georgia, serif',
  },
  {
    id: 'modern',
    label: 'Modern',
    family: '"Geist", "SF Pro Text", system-ui, sans-serif',
  },
  {
    id: 'typewriter',
    label: 'Typewriter',
    family: '"IBM Plex Mono", "GeistMono", "SF Mono", monospace',
  },
];

export function parseEditorFontChoice(value: string | null | undefined): EditorFontChoice {
  if (value === 'classic' || value === 'modern' || value === 'typewriter') {
    return value;
  }

  return EDITOR_FONT_DEFAULT;
}

export function editorFontFamily(choice: EditorFontChoice): string {
  return EDITOR_FONT_OPTIONS.find((option) => option.id === choice)?.family
    ?? EDITOR_FONT_OPTIONS[2].family;
}

export function applyEditorFont(choice: EditorFontChoice): void {
  document.documentElement.style.setProperty('--editor-font-family', editorFontFamily(choice));
}
