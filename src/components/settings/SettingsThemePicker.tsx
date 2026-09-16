import { Check, Moon, Sun } from 'lucide-react';

import { notebookThemes, type Theme, type ThemeDefaults } from '../../lib/theme';

type SettingsThemePickerProps = {
  theme: Theme;
  themeDefaults: ThemeDefaults;
  onSelect: (theme: Theme) => void;
  onSetDefault: (theme: Theme) => void;
};

export default function SettingsThemePicker({ onSelect, onSetDefault, theme, themeDefaults }: SettingsThemePickerProps) {
  return (
    <div className="settings-theme-shelf" role="group" aria-label="Notebook theme">
      {notebookThemes.map((notebookTheme) => {
        const isActive = theme === notebookTheme.id;
        const isModeDefault = themeDefaults[notebookTheme.mode] === notebookTheme.id;
        const defaultLabel = notebookTheme.mode === 'light' ? 'light-mode' : 'dark-mode';
        return (
          <button
            aria-label={`${notebookTheme.name}. ${isModeDefault ? `Current ${defaultLabel} quick-switch default.` : `Double-click to make this the ${defaultLabel} quick-switch default.`} Shift+Enter also sets the default.`}
            aria-pressed={isActive}
            className={`settings-theme-cover ${notebookTheme.coverClass}${isActive ? ' is-active' : ''}`}
            key={notebookTheme.id}
            onClick={() => onSelect(notebookTheme.id)}
            onDoubleClick={() => onSetDefault(notebookTheme.id)}
            onKeyDown={(event) => {
              if (event.shiftKey && event.key === 'Enter') {
                event.preventDefault();
                onSetDefault(notebookTheme.id);
              }
            }}
            type="button"
          >
            <span>{notebookTheme.name}</span>
            <small>{notebookTheme.description}</small>
            {isModeDefault ? (
              <span aria-hidden="true" className="settings-theme-cover-default">
                {notebookTheme.mode === 'light' ? <Sun size={14} strokeWidth={1.8} /> : <Moon size={14} strokeWidth={1.8} />}
              </span>
            ) : null}
            {isActive ? <Check aria-label="Selected" className="settings-theme-cover-check" size={15} strokeWidth={2} /> : null}
          </button>
        );
      })}
    </div>
  );
}
