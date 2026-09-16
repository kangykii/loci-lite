import { Moon, Settings, Sun, UserCircle } from 'lucide-react';
import { getNotebookTheme, type Theme } from '../../lib/theme';
import type { ViewName } from '../../hooks/useViewTransition';

type ShellSidebarNavProps = {
  activeView: ViewName;
  profileName?: string | null;
  theme: Theme;
  onOpenProfile?: () => void;
  onOpenSettings: () => void;
  onThemeToggle: () => void;
};

export default function ShellSidebarNav({
  activeView,
  profileName,
  theme,
  onOpenProfile,
  onOpenSettings,
  onThemeToggle,
}: ShellSidebarNavProps) {
  const themeMode = getNotebookTheme(theme).mode;

  return (
      <nav aria-label="Sidebar utilities" className="shell-sidebar-nav-secondary">
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
          className={`shell-sidebar-nav-item${activeView === 'profile' ? ' active' : ''}`}
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
          <span className="shell-sidebar-profile-name">Profile</span>
        </button>
      </nav>
  );
}
