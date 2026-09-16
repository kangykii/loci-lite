import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AtomPopup from '../components/atoms/AtomPopup';
import FocusExitButton from '../components/shell/FocusExitButton';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EditorSkeleton from '../components/editor/EditorSkeleton';
import OpenDocumentPopup from '../components/editor/OpenDocumentPopup';
import OutlinePanel from '../components/editor/OutlinePanel';
import Editor from '../editor/Editor';
import { ChevronDown, ChevronUp, ListTree } from 'lucide-react';
import EditorBarMenu from '../components/shell/EditorBarMenu';
import EditorPromptBar from '../components/shell/EditorPromptBar';
import { useDelayedFlag } from '../hooks/useDelayedFlag';
import { useDeleteDocument } from '../hooks/useDeleteDocument';
import { useDocument } from '../hooks/useDocument';
import { useEditorAtomBridge } from '../hooks/useEditorAtomBridge';
import { useBookmarkHighlight } from '../hooks/useBookmarkHighlight';
import { useBottomBar } from '../hooks/useBottomBar';
import { useFindHighlight } from '../hooks/useFindHighlight';
import { useDocumentScrollRestore } from '../hooks/useDocumentScrollRestore';
import { useDocumentScrollbar } from '../hooks/useDocumentScrollbar';
import { useEditorChromeEntry } from '../hooks/useEditorChromeEntry';
import { useFocusMode } from '../hooks/useFocusMode';
import { useNotifications } from '../hooks/useNotifications';
import { useTypewriterMode } from '../hooks/useTypewriterMode';
import {
  outlineEntriesForDisplay,
  outlineEntriesFromMarkdown,
  scrollToReference,
  scrollToOutlineHeading,
} from '../lib/outlineNavigation';
import { dispatchNoteClose, dispatchNoteOpen } from '../lib/pluginLifecycle';
import { isTauri } from '../lib/tauri';

type EditorViewProps = {
  fileId: string;
  onDocumentDeleted: (fileId: string) => void;
  onOpenDocument: (fileId: string) => void;
  onOpenInPane: (fileId: string, placement: 'replace' | 'split') => void;
  onCloseTab: () => void;
  active: boolean;
  canSplit: boolean;
  splitMode: boolean;
  otherFileId: string | null;
  onActivate: () => void;
};

type PendingBookmarkDelete = {
  id: string;
  sourceText: string;
};

export default function EditorView({ fileId, onDocumentDeleted, onOpenDocument, onOpenInPane, onCloseTab, active, canSplit, splitMode, otherFileId, onActivate }: EditorViewProps) {
  const [isOpenPopup, setIsOpenPopup] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const flushSaveRef = useRef<(() => Promise<void>) | null>(null);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [outlineTab, setOutlineTab] = useState<'contents' | 'references'>('contents');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingBookmarkDelete, setPendingBookmarkDelete] =
    useState<PendingBookmarkDelete | null>(null);
  const [isRemovingBookmark, setIsRemovingBookmark] = useState(false);
  const [bookmarkDeleteError, setBookmarkDeleteError] = useState<string | null>(null);
  const [editorText, setEditorText] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const titleDraftRef = useRef(titleDraft);
  titleDraftRef.current = titleDraft;
  const isDeletingNoteRef = useRef(false);
  const { isActive: isFocusMode, toggle: toggleFocusMode, exit: exitFocusMode } =
    useFocusMode(editorRootRef, fileId);
  const { isHighlightOn: isBookmarkHighlightOn, toggle: toggleBookmarkHighlight } =
    useBookmarkHighlight(editorRootRef, fileId);
  const { isActive: isTypewriterOn, toggle: toggleTypewriter } =
    useTypewriterMode(editorRootRef);
  const { state, save, renameTitle, waitForSaves } = useDocument(fileId);
  const { notifyError } = useNotifications();
  const { remove, isDeleting, error: deleteError, clearError } = useDeleteDocument();
  const documentReady = state.status === 'ready';
  const isEditorRevealed = useEditorChromeEntry(fileId, documentReady, isTypewriterOn, splitMode);
  const showFetchSkeleton = useDelayedFlag(state.status === 'loading' || state.status === 'idle');
  const showEntrySkeleton = useDelayedFlag(documentReady && !isEditorRevealed);
  const bottomBar = useBottomBar(fileId, editorText);
  const wordCountRef = useRef(bottomBar.wordCount);
  wordCountRef.current = bottomBar.wordCount;

  useEffect(() => {
    if (!documentReady) {
      return;
    }

    dispatchNoteOpen(fileId);

    return () => {
      dispatchNoteClose(fileId, wordCountRef.current);
    };
  }, [documentReady, fileId]);

  useFindHighlight(editorRootRef, bottomBar.mode, bottomBar.query, bottomBar.matchIndex, active);

  useDocumentScrollRestore(fileId, state.status === 'ready' && isEditorRevealed);
  useDocumentScrollbar(fileId);

  const handleRequestDeleteAtom = useCallback((id: string, sourceText: string) => {
    setBookmarkDeleteError(null);
    setPendingBookmarkDelete({ id, sourceText });
  }, []);

  const markdown = state.status === 'ready' ? state.markdown : '';
  const {
    atomEditor,
    editorChrome: baseEditorChrome,
    atomCreation,
    shortcutError,
    removeAtom,
    reloadAtoms,
  } = useEditorAtomBridge(fileId, markdown, handleRequestDeleteAtom);

  const editorChrome = useMemo(
    () => ({
      ...baseEditorChrome,
      isFocusMode,
      onOpenDocument,
      onOpenNewTab: () => setIsOpenPopup(true),
    }),
    [baseEditorChrome, isFocusMode, onOpenDocument],
  );

  const handleSave = useCallback(
    async (nextMarkdown: string) => {
      if (isDeletingNoteRef.current) {
        return;
      }

      setEditorText(nextMarkdown);

      try {
        await save(nextMarkdown);
      } catch (cause: unknown) {
        const message = cause instanceof Error ? cause.message : 'Failed to save note';
        notifyError(message);
        throw cause;
      }
    },
    [notifyError, save],
  );

  const documentTitle = useMemo(() => {
    if (state.status === 'ready') {
      return state.file.title ?? 'Untitled';
    }

    return 'Untitled';
  }, [state]);

  const outlineEntries = useMemo(() => {
    if (state.status !== 'ready') {
      return [];
    }

    return outlineEntriesFromMarkdown(state.markdown);
  }, [state]);

  const visibleOutlineEntries = useMemo(
    () => outlineEntriesForDisplay(outlineEntries, documentTitle),
    [documentTitle, outlineEntries],
  );
  useEffect(() => {
    if (state.status === 'ready') {
      setEditorText(state.markdown);
      setTitleDraft(state.file.title ?? '');
    }
  }, [state]);

  const handleTitleChange = useCallback(
    (nextTitle: string) => {
      setTitleDraft(nextTitle);

      if (titleSaveTimeoutRef.current) {
        clearTimeout(titleSaveTimeoutRef.current);
      }

      titleSaveTimeoutRef.current = setTimeout(() => {
        titleSaveTimeoutRef.current = null;
        titleSaveQueueRef.current = titleSaveQueueRef.current.catch(() => undefined)
          .then(() => renameTitle(nextTitle.trim() ? nextTitle : null));
        void titleSaveQueueRef.current.catch((cause: unknown) => {
          notifyError(cause instanceof Error ? cause.message : 'Failed to save note title');
        });
      }, 500);
    },
    [notifyError, renameTitle],
  );

  const flushAndSave = useCallback(async () => {
    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
      titleSaveTimeoutRef.current = null;
      const pendingTitle = titleDraftRef.current;
      titleSaveQueueRef.current = titleSaveQueueRef.current.catch(() => undefined)
        .then(() => renameTitle(pendingTitle.trim() ? pendingTitle : null));
      void titleSaveQueueRef.current.catch(() => undefined);
    }
    await titleSaveQueueRef.current;
    await flushSaveRef.current?.();
    await waitForSaves();
  }, [renameTitle, waitForSaves]);

  const handleCloseTab = useCallback(async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      await flushAndSave();
      onCloseTab();
    } catch (cause: unknown) {
      notifyError(cause instanceof Error ? cause.message : 'Failed to save note');
      setIsClosing(false);
    }
  }, [flushAndSave, isClosing, notifyError, onCloseTab]);

  const handleOpenInPane = useCallback(async (nextId: string, placement: 'replace' | 'split') => {
    if (placement === 'replace') await flushAndSave();
    onOpenInPane(nextId, placement);
    setIsOpenPopup(false);
  }, [flushAndSave, onOpenInPane]);

  useEffect(() => {
    return () => {
      if (!titleSaveTimeoutRef.current) {
        return;
      }

      clearTimeout(titleSaveTimeoutRef.current);
      titleSaveTimeoutRef.current = null;
      const pendingTitle = titleDraftRef.current;
      titleSaveQueueRef.current = titleSaveQueueRef.current.catch(() => undefined)
        .then(() => renameTitle(pendingTitle.trim() ? pendingTitle : null));
      void titleSaveQueueRef.current.catch(() => undefined);
    };
  }, [fileId, renameTitle]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!active) return;
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.shiftKey) {
        switch (event.key.toLowerCase()) {
          case 'f':
            event.preventDefault();
            toggleFocusMode();
            break;
          case 't':
            event.preventDefault();
            toggleTypewriter();
            break;
          case 'b':
            event.preventDefault();
            toggleBookmarkHighlight();
            break;
        }

        return;
      }

      if (mod && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        bottomBar.openFind();
      }

      if (event.key === 'Escape' && bottomBar.mode === 'find') {
        bottomBar.closeFind();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    active,
    bottomBar,
    toggleBookmarkHighlight,
    toggleFocusMode,
    toggleTypewriter,
  ]);

  const handleConfirmNoteDelete = useCallback(() => {
    isDeletingNoteRef.current = true;
    void remove(fileId)
      .then(() => {
        setIsDeleteConfirmOpen(false);
        onDocumentDeleted(fileId);
      })
      .catch(() => {
        isDeletingNoteRef.current = false;
        // Error state is surfaced via deleteError on the dialog.
      });
  }, [fileId, onDocumentDeleted, remove]);

  const handleConfirmBookmarkDelete = useCallback(() => {
    if (!pendingBookmarkDelete) {
      return;
    }

    setIsRemovingBookmark(true);
    setBookmarkDeleteError(null);

    void removeAtom(pendingBookmarkDelete.id)
      .then(() => {
        setPendingBookmarkDelete(null);
        reloadAtoms();
      })
      .catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : 'Failed to delete bookmark';
        setBookmarkDeleteError(message);
      })
      .finally(() => {
        setIsRemovingBookmark(false);
      });
  }, [pendingBookmarkDelete, reloadAtoms, removeAtom]);

  useEffect(() => {
    if (!active) return;
    document.body.classList.toggle('focus-mode-active', isFocusMode);

    return () => {
      document.body.classList.remove('focus-mode-active');
    };
  }, [active, isFocusMode]);

  const handleEditorRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      editorRootRef.current = node;

      if (node) {
        node.classList.toggle('bookmark-highlight-on', isBookmarkHighlightOn);
        node.classList.toggle('focus-active', isFocusMode);
        node.classList.toggle('typewriter-active', isTypewriterOn);
      }
    },
    [isBookmarkHighlightOn, isFocusMode, isTypewriterOn],
  );

  if (!isTauri()) {
    return (
      <main className="app-shell editor-view">
        <p className="editor-status">Open Loci Notepad in the desktop app to edit documents.</p>
      </main>
    );
  }

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <main className="app-shell editor-view">
        {showFetchSkeleton ? <EditorSkeleton /> : null}
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="app-shell editor-view">
        <p className="editor-status">{state.message}</p>
      </main>
    );
  }

  return (
    <main className={`app-shell editor-view${isEditorRevealed ? ' is-revealed' : ''}`}>
      <div className="editor-scroll" data-editor-scroll={fileId}>
        {!isEditorRevealed && showEntrySkeleton ? (
          <EditorSkeleton className="editor-entry-loading" />
        ) : null}
        <div className="editor-layout">
        {shortcutError ? (
          <p className="editor-shortcut-error" role="alert">
            {shortcutError}
          </p>
        ) : null}
        <Editor
          key={fileId}
          atomEditor={atomEditor}
          editorChrome={editorChrome}
          editorRootRef={handleEditorRootRef}
          initialMarkdown={state.markdown}
          onSave={handleSave}
          onFlushReady={(flush) => { flushSaveRef.current = flush; }}
          onTitleChange={handleTitleChange}
          title={titleDraft}
          typewriterActive={isTypewriterOn}
        />
        </div>
      </div>
      {isOutlineOpen ? (
        <OutlinePanel
          documentTitle={documentTitle}
          entries={visibleOutlineEntries}
          onClose={() => setIsOutlineOpen(false)}
          onNavigate={(entry) => {
            if (entry.kind === 'heading') {
              scrollToOutlineHeading(editorRootRef.current, entry.index);
            } else {
              scrollToReference(editorRootRef.current, entry.number);
            }
          }}
          onTabChange={setOutlineTab}
          tab={outlineTab}
        />
      ) : null}
      {isEditorRevealed ? (
        <>
          {active ? <FocusExitButton onExit={exitFocusMode} visible={isFocusMode} /> : null}
          <footer
            aria-label={`Editor controls for document ${fileId}`}
            className={`editor-bar bottom-bar${isFocusMode ? ' is-focus-hidden' : ''}`}
            id={`bottom-bar-${fileId}`}
            onPointerDown={onActivate}
          >
            <div className="bottom-bar-inner">
              <div className="bb-arrows">
                <button aria-label="Up" className="bb-arrow" disabled={bottomBar.arrowsDisabled} onClick={bottomBar.arrowUp} type="button">
                  <ChevronUp size={13} strokeWidth={1.8} />
                </button>
                <button aria-label="Down" className="bb-arrow" disabled={bottomBar.arrowsDisabled} onClick={bottomBar.arrowDown} type="button">
                  <ChevronDown size={13} strokeWidth={1.8} />
                </button>
              </div>
              <span className="bb-label">{bottomBar.centreLabel}</span>
              <EditorPromptBar
                findFocusTick={bottomBar.findFocusTick}
                mode={bottomBar.mode}
                onClose={bottomBar.closeFind}
                onFind={bottomBar.arrowUp}
                onQueryChange={bottomBar.setQuery}
                query={bottomBar.query}
              />
              <button
                aria-expanded={isOutlineOpen}
                aria-label={isOutlineOpen ? 'Close outline' : 'Open outline'}
                aria-pressed={isOutlineOpen}
                className={`bb-action ${isOutlineOpen ? 'active' : ''}`}
                onClick={() => setIsOutlineOpen((current) => !current)}
                type="button"
              >
                <ListTree size={14} strokeWidth={1.5} />
                <span>Outline</span>
              </button>
              <EditorBarMenu
                isBookmarkHighlightOn={isBookmarkHighlightOn}
                isClosing={isClosing}
                isFocusMode={isFocusMode}
                isTypewriterOn={isTypewriterOn}
                onBookmarkHighlightToggle={toggleBookmarkHighlight}
                onCloseTab={() => void handleCloseTab()}
                onDeleteNote={() => {
                  clearError();
                  setIsDeleteConfirmOpen(true);
                }}
                onFocusModeToggle={toggleFocusMode}
                onTypewriterToggle={toggleTypewriter}
              />
            </div>
          </footer>
      <ConfirmDialog
        error={deleteError}
        isConfirming={isDeleting}
        isOpen={isDeleteConfirmOpen}
        message={`Delete “${documentTitle}”? This permanently removes the note and all bookmarks in it.`}
        onCancel={() => {
          clearError();
          setIsDeleteConfirmOpen(false);
        }}
        onConfirm={handleConfirmNoteDelete}
        title="Delete note?"
      />
      <ConfirmDialog
        error={bookmarkDeleteError}
        isConfirming={isRemovingBookmark}
        isOpen={pendingBookmarkDelete !== null}
        message={
          pendingBookmarkDelete
            ? `Delete “${pendingBookmarkDelete.sourceText}”? This removes the bookmark only — highlighted text in the note is unchanged.`
            : ''
        }
        onCancel={() => {
          setBookmarkDeleteError(null);
          setPendingBookmarkDelete(null);
        }}
        onConfirm={handleConfirmBookmarkDelete}
        title="Delete bookmark?"
      />
      {atomCreation.isOpen ? (
        <AtomPopup
          isSaving={atomCreation.isSaving}
          onClose={atomCreation.closePopup}
          onSave={(payload) => void atomCreation.saveAtom(payload)}
          selectedText={atomCreation.selectedText}
        />
      ) : null}
        </>
      ) : null}
      {isOpenPopup ? <OpenDocumentPopup canSplit={canSplit} currentFileId={fileId} otherFileId={otherFileId} onClose={() => setIsOpenPopup(false)} onSelect={handleOpenInPane} /> : null}
    </main>
  );
}
