import { useCallback, useEffect, useMemo, useState } from 'react';

import ShellSidebar, { type SidebarPhase } from './components/shell/ShellSidebar';
import ShellSidebarTrigger from './components/shell/ShellSidebarTrigger';
import WindowChrome from './components/shell/WindowChrome';

import { TransitionShell } from './components/shell/TransitionShell';

import { useCreateDocument } from './hooks/useCreateDocument';
import { useDefaultEditorFontSetting } from './hooks/useDefaultEditorFontSetting';
import { NotificationProvider } from './hooks/useNotifications';

import { useLastDocumentReturn } from './hooks/useLastDocumentReturn';
import { useShellSidebarGesture } from './hooks/useShellSidebarGesture';
import { useTheme } from './hooks/useTheme';

import { useViewTransition, type ViewName } from './hooks/useViewTransition';

import { renderAppPage, type AppPageProps } from './lib/renderAppPage';

import { seedBaseDocumentsIfNeeded } from './lib/seedDocuments';

import { isTauri } from './lib/tauri';

import { initDb } from './store/db';

export default function App() {
  return (
    <NotificationProvider>
      <AppRoot />
    </NotificationProvider>
  );
}

function AppRoot() {

  const { current, leaving, navigate: transitionNavigate, displayView } = useViewTransition('home');

  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const [libraryRevision, setLibraryRevision] = useState(0);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [sidebarPhase, setSidebarPhase] = useState<SidebarPhase>('closed');

  const { theme, toggleTheme } = useTheme();

  useDefaultEditorFontSetting();

  const { createNew, isCreating, error: createError } = useCreateDocument();



  const bumpLibrary = useCallback(() => {

    setLibraryRevision((revision) => revision + 1);

  }, []);



  const navigateTo = useCallback(

    (next: ViewName) => transitionNavigate(next),

    [transitionNavigate],

  );

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);



  useEffect(() => {

    if (!isTauri()) {

      return;

    }



    void (async () => {

      await initDb();

      await seedBaseDocumentsIfNeeded();

    })().catch((error: unknown) => {

      console.error('Failed to initialize app data', error);

    });

  }, []);



  const handleCreateNote = useCallback(async () => {

    if (!isTauri()) {

      return;

    }

    closeSidebar();



    try {

      const id = await createNew();

      setActiveFileId(id);

      bumpLibrary();

      navigateTo('editor');

    } catch (cause: unknown) {

      console.error('Failed to create note', cause);

    }

  }, [bumpLibrary, closeSidebar, createNew, navigateTo]);



  const handleOpenEditor = useCallback(

    (fileId: string) => {

      closeSidebar();
      setActiveFileId(fileId);

      navigateTo('editor');

    },

    [closeSidebar, navigateTo],

  );

  const { openLastDocument } = useLastDocumentReturn(handleOpenEditor);

  const isSidebarGestureLocked = sidebarPhase === 'entering' || sidebarPhase === 'leaving';

  const handleSidebarNavigate = useCallback(
    (next: ViewName) => {
      closeSidebar();
      navigateTo(next);
    },
    [closeSidebar, navigateTo],
  );

  useShellSidebarGesture({
    activeView: displayView,
    isGestureLocked: isSidebarGestureLocked,
    isSidebarOpen,
    onCloseSidebar: closeSidebar,
    onGoHome: () => handleSidebarNavigate('home'),
    onOpenLastDocument: openLastDocument,
    onOpenSidebar: openSidebar,
  });



  const handleDocumentDeleted = useCallback(

    (fileId: string, source: 'editor' | 'browse') => {

      setActiveFileId((current) => (current === fileId ? null : current));

      bumpLibrary();



      if (source === 'editor') {

        navigateTo('home');

      }

    },

    [bumpLibrary, navigateTo],

  );



  const pageProps = useMemo<AppPageProps>(

    () => ({

      activeFileId,

      libraryRevision,

      isCreating,

      createError: createError ?? null,

      onCreateNote: () => void handleCreateNote(),

      onOpenEditor: handleOpenEditor,

      onOpenDocuments: () => navigateTo('documents'),

      onOpenBookmarks: () => navigateTo('atoms'),

      onDocumentDeleted: handleDocumentDeleted,

    }),

    [

      activeFileId,

      createError,

      handleCreateNote,

      handleDocumentDeleted,

      handleOpenEditor,

      isCreating,

      libraryRevision,

      navigateTo,

    ],

  );



  return (

    <>

      <div className="shell-header">
        <WindowChrome />
      </div>
      <ShellSidebarTrigger isOpen={isSidebarOpen} onOpen={openSidebar} />
      <ShellSidebar
        activeView={displayView}
        isOpen={isSidebarOpen}
        isCreating={isCreating}
        libraryRevision={libraryRevision}
        onClose={closeSidebar}
        onCreateNote={() => void handleCreateNote()}
        onGoHome={() => handleSidebarNavigate('home')}
        onOpenBookmarks={() => handleSidebarNavigate('atoms')}
        onOpenDocument={handleOpenEditor}
        onOpenDocumentsPage={() => handleSidebarNavigate('documents')}
        onOpenSettings={() => handleSidebarNavigate('settings')}
        onPhaseChange={setSidebarPhase}
        onThemeToggle={toggleTheme}
        theme={theme}
      />

      <div className="view-stage">

        {leaving ? (

          <TransitionShell config={leaving}>{renderAppPage(leaving.name, pageProps)}</TransitionShell>

        ) : (

          <TransitionShell config={current}>{renderAppPage(current.name, pageProps)}</TransitionShell>

        )}

      </div>

    </>

  );

}


