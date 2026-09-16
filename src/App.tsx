import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ShellSidebar from './components/shell/ShellSidebar';
import WindowChrome from './components/shell/WindowChrome';

import { TransitionShell } from './components/shell/TransitionShell';

import { useCreateDocument } from './hooks/useCreateDocument';
import { useDefaultEditorFontSetting } from './hooks/useDefaultEditorFontSetting';
import { NotificationProvider } from './hooks/useNotifications';

import { useLastDocumentReturn } from './hooks/useLastDocumentReturn';
import { useLocalProfile } from './hooks/useLocalProfile';
import { useShellSidebarGesture } from './hooks/useShellSidebarGesture';
import { useTheme } from './hooks/useTheme';

import { useViewTransition, type ViewName } from './hooks/useViewTransition';

import { renderAppPage, type AppPageProps } from './lib/renderAppPage';

import { isTauri, setAdaptiveWindowMinimum } from './lib/tauri';

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
  const [adjacentFileId, setAdjacentFileId] = useState<string | null>(null);
  const [activePaneId, setActivePaneId] = useState<string | null>(null);
  const [canSplit, setCanSplit] = useState(false);

  const [libraryRevision, setLibraryRevision] = useState(0);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [viewHistory, setViewHistory] = useState<ViewName[]>(['home']);

  const [historyIndex, setHistoryIndex] = useState(0);

  const viewHistoryRef = useRef({ entries: ['home'] as ViewName[], index: 0 });

  const { theme, themeDefaults, setTheme, setThemeDefault, toggleTheme } = useTheme();

  const { profile, ready: profileReady, saveProfile } = useLocalProfile();
  const profileName = profile.name;

  useDefaultEditorFontSetting();

  const { createNew, isCreating, error: createError } = useCreateDocument();

  useEffect(() => {
    if (!isTauri()) return;
    void setAdaptiveWindowMinimum();
    const update = () => {
      const stage = document.querySelector<HTMLElement>('.view-stage');
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      setCanSplit(Boolean(stage && stage.clientWidth >= rem * 58));
    };
    const observer = new ResizeObserver(update);
    const stage = document.querySelector<HTMLElement>('.view-stage');
    if (stage) observer.observe(stage);
    update();
    return () => observer.disconnect();
  }, []);



  const bumpLibrary = useCallback(() => {

    setLibraryRevision((revision) => revision + 1);

  }, []);



  const navigateTo = useCallback((next: ViewName) => {
    const history = viewHistoryRef.current;

    if (history.entries[history.index] !== next) {
      const entries = [...history.entries.slice(0, history.index + 1), next];
      const index = entries.length - 1;

      viewHistoryRef.current = { entries, index };
      setViewHistory(entries);
      setHistoryIndex(index);
    }

    transitionNavigate(next);
  }, [transitionNavigate]);

  const moveInHistory = useCallback((direction: -1 | 1) => {
    const history = viewHistoryRef.current;
    const index = history.index + direction;

    if (index < 0 || index >= history.entries.length) {
      return;
    }

    viewHistoryRef.current = { ...history, index };
    setHistoryIndex(index);
    transitionNavigate(history.entries[index]);
  }, [transitionNavigate]);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((isOpen) => !isOpen);
  }, []);

  const handleOpenProfile = useCallback(() => {
    navigateTo('profile');
  }, [navigateTo]);



  const handleCreateNote = useCallback(async () => {

    if (!isTauri()) {

      return;

    }

    try {

      const id = await createNew();

      setActiveFileId(id);
      setAdjacentFileId(null);
      setActivePaneId(id);

      bumpLibrary();

      navigateTo('editor');

    } catch (cause: unknown) {

      console.error('Failed to create note', cause);

    }

  }, [bumpLibrary, createNew, navigateTo]);



  const handleOpenEditor = useCallback(

    (fileId: string) => {

      setActiveFileId(fileId);
      setAdjacentFileId(null);
      setActivePaneId(fileId);

      navigateTo('editor');

    },

    [navigateTo],

  );

  const { openLastDocument } = useLastDocumentReturn(handleOpenEditor);

  const handleOpenInPane = useCallback((sourceId: string, nextId: string, placement: 'replace' | 'split') => {
    if (nextId === activeFileId || nextId === adjacentFileId) return;
    if (placement === 'split') {
      if (!canSplit || adjacentFileId || nextId === activeFileId) return;
      setAdjacentFileId(nextId);
      setActivePaneId(nextId);
      return;
    }
    if (sourceId === activeFileId) setActiveFileId(nextId);
    else setAdjacentFileId(nextId);
    setActivePaneId(nextId);
    bumpLibrary();
  }, [activeFileId, adjacentFileId, bumpLibrary, canSplit]);

  const handleCloseTab = useCallback((fileId: string) => {
    if (adjacentFileId) {
      if (fileId === activeFileId) {
        setActiveFileId(adjacentFileId);
      }
      setAdjacentFileId(null);
      setActivePaneId(fileId === activeFileId ? adjacentFileId : activeFileId);
    } else {
      setActiveFileId(null);
      setActivePaneId(null);
      navigateTo('home');
    }
    bumpLibrary();
  }, [activeFileId, adjacentFileId, bumpLibrary, navigateTo]);

  useEffect(() => {
    if (!adjacentFileId || canSplit) return;
    setAdjacentFileId(null);
    setActivePaneId(activeFileId);
  }, [activeFileId, adjacentFileId, canSplit]);

  const handleSidebarNavigate = useCallback(
    (next: ViewName) => {
      navigateTo(next);
    },
    [navigateTo],
  );

  useShellSidebarGesture({
    activeView: displayView,
    isGestureLocked: false,
    isSidebarOpen,
    onCloseSidebar: closeSidebar,
    onGoHome: () => handleSidebarNavigate('home'),
    onOpenLastDocument: openLastDocument,
    onOpenSidebar: openSidebar,
  });

  const handleDocumentDeleted = useCallback(

    (fileId: string, source: 'editor' | 'browse') => {

      setActiveFileId((current) => (current === fileId ? null : current));
      setAdjacentFileId((current) => (current === fileId ? null : current));

      bumpLibrary();



      if (source === 'editor') {

        if (adjacentFileId && fileId !== adjacentFileId) {
          setActiveFileId(adjacentFileId);
          setAdjacentFileId(null);
          setActivePaneId(adjacentFileId);
        } else if (adjacentFileId) {
          setAdjacentFileId(null);
          setActivePaneId(activeFileId);
        } else {
          navigateTo('home');
        }

      }

    },

    [activeFileId, adjacentFileId, bumpLibrary, navigateTo],

  );



  const pageProps = useMemo<AppPageProps>(

    () => ({

      activeFileId,
      adjacentFileId,
      activePaneId,
      canSplit,

      libraryRevision,

      isCreating,

      createError: createError ?? null,

      onCreateNote: () => void handleCreateNote(),

      onOpenEditor: handleOpenEditor,
      onOpenInPane: handleOpenInPane,
      onCloseTab: handleCloseTab,
      onActivatePane: setActivePaneId,

      onOpenDocuments: () => navigateTo('documents'),

      profile,
      profileReady,
      onSaveProfile: saveProfile,

      onDocumentDeleted: handleDocumentDeleted,
      onThemeDefaultSelect: setThemeDefault,
      onThemeSelect: setTheme,
      theme,
      themeDefaults,

    }),

    [

      activeFileId,
      adjacentFileId,
      activePaneId,
      canSplit,

      createError,

      handleCreateNote,

      handleDocumentDeleted,

      handleOpenEditor,
      handleOpenInPane,
      handleCloseTab,
      isCreating,

      libraryRevision,

      navigateTo,
      profile,
      profileReady,
      saveProfile,
      setTheme,
      setThemeDefault,
      theme,
      themeDefaults,

    ],

  );



  return (

    <>

      <WindowChrome
        canCreate={isTauri()}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < viewHistory.length - 1}
        isCreating={isCreating}
        isSidebarOpen={isSidebarOpen}
        onCreateNote={() => void handleCreateNote()}
        onGoBack={() => moveInHistory(-1)}
        onGoForward={() => moveInHistory(1)}
        onOpenBookmarks={() => navigateTo('atoms')}
        onOpenLibrary={() => navigateTo('documents')}
        onOpenSearch={() => navigateTo('documents')}
        onOpenSidebar={toggleSidebar}
      />
      <div className={`app-frame${isSidebarOpen ? ' has-sidebar' : ''}`}>
        {isSidebarOpen ? (
          <ShellSidebar
            activeFileId={activeFileId}
            activeView={displayView}
            libraryRevision={libraryRevision}
            onOpenDocument={handleOpenEditor}
            onOpenProfile={handleOpenProfile}
            onOpenSettings={() => handleSidebarNavigate('settings')}
            onThemeToggle={toggleTheme}
            profileName={profileName}
            theme={theme}
          />
        ) : null}
        <div className="view-stage">

          {leaving ? (

            <TransitionShell config={leaving}>{renderAppPage(leaving.name, pageProps)}</TransitionShell>

          ) : (

            <TransitionShell config={current}>{renderAppPage(current.name, pageProps)}</TransitionShell>

          )}

        </div>
      </div>

    </>

  );

}


