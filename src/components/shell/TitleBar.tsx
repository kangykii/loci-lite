import { Moon, Settings, Sun } from 'lucide-react';
import type { Theme } from '../../lib/theme';

type TitleBarProps = {
  activeView: 'home' | 'editor' | 'documents' | 'atoms' | 'settings';
  onNavigate: (view: 'home' | 'documents' | 'atoms') => void;
  onOpenSettings: () => void;
  theme: Theme;
  onThemeToggle: () => void;
};

export default function TitleBar({
  activeView,
  onNavigate,
  onOpenSettings,
  onThemeToggle,
  theme,
}: TitleBarProps) {
  return (
    <header aria-label="Loci Notepad title bar" className="titlebar">
      <nav className="titlebar-group" aria-label="Primary navigation">
        <button
          className="titlebar-button titlebar-brand"
          onClick={() => onNavigate('home')}
          type="button"
        >
          Loci
        </button>
        <button
          className={`titlebar-button ${activeView === 'documents' ? 'active' : ''}`}
          onClick={() => onNavigate('documents')}
          type="button"
        >
          Documents
        </button>
        <button
          className={`titlebar-button ${activeView === 'atoms' ? 'active' : ''}`}
          onClick={() => onNavigate('atoms')}
          type="button"
        >
          Bookmarks
        </button>
      </nav>
      <div className="titlebar-group right">
        <button
          aria-label="Settings"
          className="titlebar-icon-button"
          onClick={onOpenSettings}
          type="button"
        >
          <Settings size={16} strokeWidth={1.5} />
        </button>
        <button
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="titlebar-icon-button"
          onClick={onThemeToggle}
          type="button"
        >
          {theme === 'dark' ? (
            <Sun size={16} strokeWidth={1.5} />
          ) : (
            <Moon size={16} strokeWidth={1.5} />
          )}
        </button>
        <button aria-label="Profile" className="titlebar-avatar" type="button">
          K
        </button>
      </div>
    </header>
  );
}
