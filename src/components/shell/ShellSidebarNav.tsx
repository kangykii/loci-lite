import { Bookmark, Moon, Plus, Settings, Sun, UserCircle } from 'lucide-react';
import type { Theme } from '../../lib/theme';
import type { ViewName } from '../../hooks/useViewTransition';

type ShellSidebarNavProps = {
  activeView: ViewName;
  isCreating?: boolean;
  placement: 'primary' | 'secondary';
  theme: Theme;
  onCreateNote?: () => void;
  onGoHome: () => void;
  onOpenBookmarks: () => void;
  onOpenSettings: () => void;
  onThemeToggle: () => void;
};

export default function ShellSidebarNav({
  activeView,
  isCreating,
  placement,
  theme,
  onCreateNote,
  onGoHome,
  onOpenBookmarks,
  onOpenSettings,
  onThemeToggle,
}: ShellSidebarNavProps) {
  if (placement === 'secondary') {
    return (
      <nav aria-label="App settings" className="shell-sidebar-nav-secondary">
        <button
          className={`shell-sidebar-nav-item${activeView === 'settings' ? ' active' : ''}`}
          onClick={onOpenSettings}
          type="button"
        >
          <Settings size={16} strokeWidth={1.5} />
          <span>Settings</span>
        </button>
        <button className="shell-sidebar-nav-item" onClick={onThemeToggle} type="button">
          {theme === 'dark' ? (
            <Sun size={16} strokeWidth={1.5} />
          ) : (
            <Moon size={16} strokeWidth={1.5} />
          )}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button className="shell-sidebar-nav-item" disabled type="button">
          <UserCircle size={16} strokeWidth={1.5} />
          <span>Profile</span>
        </button>
      </nav>
    );
  }

  return (
    <nav aria-label="App navigation" className="shell-sidebar-nav">
      <button
        className={`shell-sidebar-heading${activeView === 'home' ? ' active' : ''}`}
        onClick={onGoHome}
        type="button"
      >
        Loci Notebook
      </button>
      <button
        className="shell-sidebar-new-note"
        disabled={isCreating}
        onClick={onCreateNote}
        type="button"
      >
        <Plus size={16} strokeWidth={1.5} />
        <span>{isCreating ? 'Creating...' : 'New note'}</span>
      </button>
      <button
        className={`shell-sidebar-nav-item${activeView === 'atoms' ? ' active' : ''}`}
        onClick={onOpenBookmarks}
        type="button"
      >
        <Bookmark size={16} strokeWidth={1.5} />
        <span>Bookmarks</span>
      </button>
    </nav>
  );
}
