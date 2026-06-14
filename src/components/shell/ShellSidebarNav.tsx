import { Bookmark, Moon, Plus, Settings, Sun, UserCircle } from 'lucide-react';
import { getNotebookTheme, type Theme } from '../../lib/theme';
import type { ViewName } from '../../hooks/useViewTransition';

type ShellSidebarNavProps = {
  activeView: ViewName;
  isCreating?: boolean;
  placement: 'primary' | 'secondary';
  profileName?: string | null;
  theme: Theme;
  onCreateNote?: () => void;
  onGoHome: () => void;
  onOpenBookmarks: () => void;
  onOpenProfile?: () => void;
  onOpenSettings: () => void;
  onThemeToggle: () => void;
};

export default function ShellSidebarNav({
  activeView,
  isCreating,
  placement,
  profileName,
  theme,
  onCreateNote,
  onGoHome,
  onOpenBookmarks,
  onOpenProfile,
  onOpenSettings,
  onThemeToggle,
}: ShellSidebarNavProps) {
  const themeMode = getNotebookTheme(theme).mode;

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
          {themeMode === 'dark' ? (
            <Sun size={16} strokeWidth={1.5} />
          ) : (
            <Moon size={16} strokeWidth={1.5} />
          )}
          <span>{themeMode === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button
          className={`shell-sidebar-nav-item${activeView === 'account' ? ' active' : ''}`}
          onClick={onOpenProfile}
          type="button"
        >
          {profileName ? (
            <span aria-hidden="true" className="shell-sidebar-avatar">
              {profileName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <UserCircle size={16} strokeWidth={1.5} />
          )}
          <span className="shell-sidebar-profile-name">{profileName ? 'Account' : 'Profile'}</span>
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
