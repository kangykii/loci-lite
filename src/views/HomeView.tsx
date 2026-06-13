import { useEffect, useMemo, useState } from 'react';

import HomeQuickActions from '../components/home/HomeQuickActions';
import RecentFiles from '../components/home/RecentFiles';
import WelcomeHeading from '../components/home/WelcomeHeading';
import { useDocumentContextMenu } from '../hooks/useDocumentContextMenu';
import { useSearchableDocuments } from '../hooks/useSearchableDocuments';
import { useSearchStagger } from '../hooks/useSearchStagger';
import { matchesSearch } from '../lib/searchMatch';
import { isTauri } from '../lib/tauri';

type HomeViewProps = {
  onCreateNote: () => void;
  onOpenEditor: (fileId: string) => void;
  onOpenDocuments: () => void;
  onOpenBookmarks: () => void;
  isCreating?: boolean;
  createError?: string | null;
  listRefreshKey?: number;
};

export default function HomeView({
  onCreateNote,
  onOpenEditor,
  onOpenDocuments,
  onOpenBookmarks,
  isCreating,
  createError,
  listRefreshKey,
}: HomeViewProps) {
  const canCreate = isTauri();
  const [searchQuery, setSearchQuery] = useState('');
  const { documents, status, refresh } = useSearchableDocuments();
  const documentMenu = useDocumentContextMenu({
    onChanged: refresh,
    onOpenDocument: onOpenEditor,
  });
  const hasActiveSearch = searchQuery.trim().length > 0;

  const visibleFiles = useMemo(() => {
    if (!hasActiveSearch) {
      return documents.slice(0, 10);
    }

    return documents.filter((document) => matchesSearch(document.haystack, searchQuery));
  }, [documents, hasActiveSearch, searchQuery]);

  const { displayedItems: staggeredFiles, isLeaving: listStaggerLeaving } = useSearchStagger(
    searchQuery,
    visibleFiles,
  );

  useEffect(() => {
    void refresh();
  }, [refresh, listRefreshKey]);

  return (
    <main className="app-shell home-view">
      <WelcomeHeading />

      {!canCreate ? (
        <p className="library-status desktop-only-hint" role="status">
          Notes are created in the Loci Notepad desktop app. Run{' '}
          <code>corepack pnpm tauri dev</code> and use the app window — not the browser tab at
          localhost:1420.
        </p>
      ) : null}

      {createError ? (
        <p className="library-status create-error" role="alert">
          Could not create note: {createError}
        </p>
      ) : null}

      <HomeQuickActions
        canCreate={canCreate}
        isCreating={isCreating}
        onCreateNote={onCreateNote}
        onOpenBookmarks={onOpenBookmarks}
      />

      <RecentFiles
        files={staggeredFiles}
        hasActiveSearch={hasActiveSearch}
        hasLibrary={documents.length > 0}
        listStaggerLeaving={listStaggerLeaving}
        onDocumentContextMenu={documentMenu.openMenu}
        onOpenDocuments={onOpenDocuments}
        onOpenEditor={onOpenEditor}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        status={status}
      />
      {documentMenu.element}
    </main>
  );
}
