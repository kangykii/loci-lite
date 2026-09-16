import type { ReactNode } from 'react';

import type { ViewName } from '../hooks/useViewTransition';
import type { Theme, ThemeDefaults } from './theme';
import AtomsView from '../views/AtomsView';
import DocumentsView from '../views/DocumentsView';
import EditorView from '../views/EditorView';
import EditorPanes from '../components/editor/EditorPanes';
import HomeView from '../views/HomeView';
import ProfileView from '../views/ProfileView';
import SettingsView from '../views/SettingsView';
import type { LocalProfile } from '../store/settings.store';

export type AppPageProps = {
  activeFileId: string | null;
  adjacentFileId: string | null;
  activePaneId: string | null;
  canSplit: boolean;
  libraryRevision: number;
  isCreating: boolean;
  createError: string | null;
  onCreateNote: () => void;
  onOpenEditor: (fileId: string) => void;
  onOpenInPane: (sourceId: string, fileId: string, placement: 'replace' | 'split') => void;
  onCloseTab: (fileId: string) => void;
  onActivatePane: (fileId: string) => void;
  onOpenDocuments: () => void;
  profile: LocalProfile;
  profileReady: boolean;
  onSaveProfile: (profile: LocalProfile) => Promise<boolean>;
  onDocumentDeleted: (fileId: string, source: 'editor' | 'browse') => void;
  onThemeSelect: (theme: Theme) => void;
  onThemeDefaultSelect: (theme: Theme) => void;
  theme: Theme;
  themeDefaults: ThemeDefaults;
};

export function renderAppPage(view: ViewName, props: AppPageProps): ReactNode {
  const {
    activeFileId,
    adjacentFileId,
    activePaneId,
    canSplit,
    libraryRevision,
    isCreating,
    createError,
    onCreateNote,
    onOpenEditor,
    onOpenInPane,
    onCloseTab,
    onActivatePane,
    onOpenDocuments,
    profile,
    profileReady,
    onSaveProfile,
    onDocumentDeleted,
    onThemeSelect,
    onThemeDefaultSelect,
    theme,
    themeDefaults,
  } = props;

  switch (view) {
    case 'editor':
      return activeFileId ? (
        <EditorPanes
          activePaneId={activePaneId}
          canSplit={canSplit}
          fileIds={[activeFileId, adjacentFileId]}
          onActivatePane={onActivatePane}
          onCloseTab={onCloseTab}
          onDocumentDeleted={(fileId) => onDocumentDeleted(fileId, 'editor')}
          onOpenDocument={onOpenEditor}
          onOpenInPane={onOpenInPane}
        />
      ) : (
        <main className="app-shell editor-view">
          <p className="editor-status">No document selected.</p>
        </main>
      );
    case 'settings':
      return <SettingsView
        onThemeDefaultSelect={onThemeDefaultSelect}
        onThemeSelect={onThemeSelect}
        theme={theme}
        themeDefaults={themeDefaults}
      />;
    case 'profile':
      return <ProfileView onSaveProfile={onSaveProfile} profile={profile} ready={profileReady} />;
    case 'home':
      return (
        <HomeView
          createError={createError}
          listRefreshKey={libraryRevision}
          onOpenDocuments={onOpenDocuments}
          onOpenEditor={onOpenEditor}
        />
      );
    case 'documents':
      return (
        <DocumentsView
          createError={createError}
          isCreating={isCreating}
          listRefreshKey={libraryRevision}
          onCreateNote={onCreateNote}
          onDocumentDeleted={(fileId) => onDocumentDeleted(fileId, 'browse')}
          onOpenEditor={onOpenEditor}
        />
      );
    case 'atoms':
      return <AtomsView activeFileId={activeFileId} listRefreshKey={libraryRevision} />;
    default:
      return null;
  }
}
