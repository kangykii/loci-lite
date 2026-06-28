import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AtomPopup from '../components/atoms/AtomPopup';
import BottomBar from '../components/shell/BottomBar';
import FocusExitButton from '../components/shell/FocusExitButton';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Editor from '../editor/Editor';
import { useDeleteDocument } from '../hooks/useDeleteDocument';
import { useDocument } from '../hooks/useDocument';
import { useEditorAtomBridge } from '../hooks/useEditorAtomBridge';
import { useEditorAuthorshipBridge } from '../hooks/useEditorAuthorshipBridge';
import { useAuthorshipMode } from '../hooks/useAuthorshipMode';
import { useBookmarkHighlight } from '../hooks/useBookmarkHighlight';
import { useBottomBar } from '../hooks/useBottomBar';
import { useFindHighlight } from '../hooks/useFindHighlight';
import { useDocumentScrollRestore } from '../hooks/useDocumentScrollRestore';
import { useDocumentScrollbar } from '../hooks/useDocumentScrollbar';
import { useEditorChromeEntry } from '../hooks/useEditorChromeEntry';
import { useFocusMode } from '../hooks/useFocusMode';
import { useTypewriterMode } from '../hooks/useTypewriterMode';
import {
  outlineEntriesForDisplay,
  outlineEntriesFromMarkdown,
  scrollToOutlineHeading,
} from '../lib/outlineNavigation';
import { dispatchNoteClose, dispatchNoteOpen } from '../lib/pluginLifecycle';
import { isTauri } from '../lib/tauri';

type EditorViewProps = {
  fileId: string;
  onDocumentDeleted: (fileId: string) => void;
  onOpenDocument: (fileId: string) => void;
};

type PendingBookmarkDelete = {
  id: string;
  sourceText: string;
};

type OutlineRowStyle = CSSProperties & {
  '--outline-depth': number;
};

export default function EditorView({ fileId, onDocumentDeleted, onOpenDocument }: EditorViewProps) {
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingBookmarkDelete, setPendingBookmarkDelete] =
    useState<PendingBookmarkDelete | null>(null);
  const [isRemovingBookmark, setIsRemovingBookmark] = useState(false);
  const [bookmarkDeleteError, setBookmarkDeleteError] = useState<string | null>(null);
  const [editorText, setEditorText] = useState('');
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const isDeletingNoteRef = useRef(false);
  const { isActive: isFocusMode, toggle: toggleFocusMode, exit: exitFocusMode } =
    useFocusMode(editorRootRef, fileId);
  const { isActive: isAuthorshipOn, toggle: toggleAuthorship } =
    useAuthorshipMode(editorRootRef, fileId);
  const { isHighlightOn: isBookmarkHighlightOn, toggle: toggleBookmarkHighlight } =
    useBookmarkHighlight(editorRootRef, fileId);
  const { isActive: isTypewriterOn, toggle: toggleTypewriter } =
    useTypewriterMode(editorRootRef);
  const { state, save } = useDocument(fileId);
  const { remove, isDeleting, error: deleteError, clearError } = useDeleteDocument();
  const documentReady = state.status === 'ready';
  const isEditorRevealed = useEditorChromeEntry(fileId, documentReady);
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

  useFindHighlight(editorRootRef, bottomBar.mode, bottomBar.query, bottomBar.matchIndex);

  useDocumentScrollRestore(fileId, state.status === 'ready' && isEditorRevealed);
  useDocumentScrollbar();

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
  const { authorshipEditor: baseAuthorshipEditor } = useEditorAuthorshipBridge(fileId);
  const authorshipEditor = useMemo(
    () => ({
      ...baseAuthorshipEditor,
      authorshipVisible: isAuthorshipOn,
    }),
    [baseAuthorshipEditor, isAuthorshipOn],
  );

  const editorChrome = useMemo(
    () => ({
      ...baseEditorChrome,
      isFocusMode,
      onOpenDocument,
    }),
    [baseEditorChrome, isFocusMode, onOpenDocument],
  );

  const handleSave = useCallback(
    (nextMarkdown: string) => {
      if (isDeletingNoteRef.current) {
        return;
      }

      setEditorText(nextMarkdown);
      void save(nextMarkdown);
    },
    [save],
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
    }
  }, [state]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
          case 'a':
            event.preventDefault();
            toggleAuthorship();
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
    bottomBar,
    toggleAuthorship,
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
    document.body.classList.toggle('focus-mode-active', isFocusMode);

    return () => {
      document.body.classList.remove('focus-mode-active');
    };
  }, [isFocusMode]);

  const handleEditorRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      editorRootRef.current = node;

      if (node) {
        node.classList.toggle('authorship-visible', isAuthorshipOn);
        node.classList.toggle('bookmark-highlight-on', isBookmarkHighlightOn);
        node.classList.toggle('focus-active', isFocusMode);
        node.classList.toggle('typewriter-active', isTypewriterOn);
      }
    },
    [isAuthorshipOn, isBookmarkHighlightOn, isFocusMode, isTypewriterOn],
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
        <p className="editor-status">Loading document…</p>
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
    <main className="app-shell editor-view">
      {!isEditorRevealed ? (
        <p className="editor-status editor-entry-loading">Loading document…</p>
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
          authorshipEditor={authorshipEditor}
          editorChrome={editorChrome}
          editorRootRef={handleEditorRootRef}
          initialMarkdown={state.markdown}
          onSave={handleSave}
          typewriterActive={isTypewriterOn}
        />
        {isOutlineOpen ? (
          <div className="outline-layer" role="presentation">
            <button
              aria-label="Close outline"
              className="outline-scrim"
              onClick={() => setIsOutlineOpen(false)}
              type="button"
            />
            <aside
              aria-label={`Table of contents for ${documentTitle}`}
              className="outline-panel"
            >
              <p className="outline-panel-title">{documentTitle}</p>
              <nav aria-label="Outline sections" className="outline-nav">
                {visibleOutlineEntries.length > 0 ? (
                  visibleOutlineEntries.map((entry) => (
                    <button
                      aria-label={`H${entry.level}: ${entry.text}`}
                      data-level={entry.level}
                      key={`${entry.text}-${entry.index}`}
                      onClick={() => scrollToOutlineHeading(editorRootRef.current, entry.index)}
                      style={
                        {
                          '--outline-depth': Math.min(entry.level - 1, 4),
                        } as OutlineRowStyle
                      }
                      type="button"
                    >
                      {entry.text}
                    </button>
                  ))
                ) : (
                  <p className="outline-empty">No headings yet</p>
                )}
              </nav>
            </aside>
          </div>
        ) : null}
      </div>
      {isEditorRevealed ? (
        <>
      <FocusExitButton onExit={exitFocusMode} visible={isFocusMode} />
      <BottomBar
        arrowsDisabled={bottomBar.arrowsDisabled}
        centreLabel={bottomBar.centreLabel}
        findFocusTick={bottomBar.findFocusTick}
        isAuthorshipOn={isAuthorshipOn}
        isBookmarkHighlightOn={isBookmarkHighlightOn}
        isFocusMode={isFocusMode}
        isOutlineOpen={isOutlineOpen}
        isTypewriterOn={isTypewriterOn}
        mode={bottomBar.mode}
        onArrowDown={bottomBar.arrowDown}
        onArrowUp={bottomBar.arrowUp}
        onAuthorshipToggle={toggleAuthorship}
        onBookmarkHighlightToggle={toggleBookmarkHighlight}
        onCloseFind={bottomBar.closeFind}
        onDeleteNote={() => {
          clearError();
          setIsDeleteConfirmOpen(true);
        }}
        onFind={bottomBar.arrowUp}
        onFocusModeToggle={toggleFocusMode}
        onOutlineToggle={() => setIsOutlineOpen((current) => !current)}
        onQueryChange={bottomBar.setQuery}
        onReplace={() => undefined}
        onReplacementChange={bottomBar.setReplacement}
        onTypewriterToggle={toggleTypewriter}
        query={bottomBar.query}
        replacement={bottomBar.replacement}
      />
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
    </main>
  );
}
