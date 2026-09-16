import type { Theme } from '../../lib/theme';
import type { ViewName } from '../../hooks/useViewTransition';
import ShellSidebarLibrary from './ShellSidebarLibrary';
import ShellSidebarNav from './ShellSidebarNav';

type ShellSidebarProps = {
  activeFileId: string | null;
  activeView: ViewName;
  libraryRevision: number;
  profileName?: string | null;
  theme: Theme;
  onOpenDocument: (fileId: string) => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onThemeToggle: () => void;
};

export default function ShellSidebar({
  activeFileId,
  activeView,
  libraryRevision,
  profileName,
  theme,
  onOpenDocument,
  onOpenProfile,
  onOpenSettings,
  onThemeToggle,
}: ShellSidebarProps) {
  return (
    <aside aria-label="Notes sidebar" className="shell-sidebar-panel">
      <ShellSidebarLibrary
        activeFileId={activeFileId}
        listRefreshKey={libraryRevision}
        onOpenDocument={onOpenDocument}
      />
      <ShellSidebarNav
        activeView={activeView}
        onOpenProfile={onOpenProfile}
        onOpenSettings={onOpenSettings}
        onThemeToggle={onThemeToggle}
        profileName={profileName}
        theme={theme}
      />
    </aside>
  );
}
