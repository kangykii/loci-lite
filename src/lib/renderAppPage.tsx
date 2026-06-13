import type { ReactNode } from 'react';

import type { ViewName } from '../hooks/useViewTransition';
import type { Theme } from './theme';
import AccountView from '../views/AccountView';
import AtomsView from '../views/AtomsView';
import DocumentsView from '../views/DocumentsView';
import EditorView from '../views/EditorView';
import HomeView from '../views/HomeView';
import SettingsView from '../views/SettingsView';

export type AppPageProps = {
  activeFileId: string | null;
  libraryRevision: number;
  isCreating: boolean;
  createError: string | null;
  onCreateNote: () => void;
  onOpenEditor: (fileId: string) => void;
  onOpenDocuments: () => void;
  onOpenBookmarks: () => void;
  onOpenProfile: () => void;
  onDocumentDeleted: (fileId: string, source: 'editor' | 'browse') => void;
  onThemeSelect: (theme: Theme) => void;
  theme: Theme;
};

export function renderAppPage(view: ViewName, props: AppPageProps): ReactNode {
  const {
    activeFileId,
    libraryRevision,
    isCreating,
    createError,
    onCreateNote,
    onOpenEditor,
    onOpenDocuments,
    onOpenBookmarks,
    onOpenProfile,
    onDocumentDeleted,
    onThemeSelect,
    theme,
  } = props;

  switch (view) {
    case 'editor':
      return activeFileId ? (
        <EditorView
          fileId={activeFileId}
          onDocumentDeleted={(fileId) => onDocumentDeleted(fileId, 'editor')}
          onOpenDocument={onOpenEditor}
        />
      ) : (
        <main className="app-shell editor-view">
          <p className="editor-status">No document selected.</p>
        </main>
      );
    case 'settings':
      return <SettingsView />;
    case 'account':
      return (
        <AccountView
          onOpenProfile={onOpenProfile}
          onThemeSelect={onThemeSelect}
          theme={theme}
        />
      );
    case 'home':
      return (
        <HomeView
          isCreating={isCreating}
          listRefreshKey={libraryRevision}
          onCreateNote={onCreateNote}
          onOpenBookmarks={onOpenBookmarks}
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
