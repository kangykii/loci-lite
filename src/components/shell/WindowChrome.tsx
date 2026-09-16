import { createPortal } from 'react-dom';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Library,
  Minus,
  PanelLeft,
  Plus,
  Search,
  Square,
  X,
} from 'lucide-react';

import { useWindowChrome } from '../../hooks/useWindowChrome';
import { isTauri } from '../../lib/tauri';

type WindowChromeProps = {
  canCreate: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isCreating: boolean;
  isSidebarOpen: boolean;
  onCreateNote: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onOpenBookmarks: () => void;
  onOpenLibrary: () => void;
  onOpenSearch: () => void;
  onOpenSidebar: () => void;
};

export default function WindowChrome({
  canCreate,
  canGoBack,
  canGoForward,
  isCreating,
  isSidebarOpen,
  onCreateNote,
  onGoBack,
  onGoForward,
  onOpenBookmarks,
  onOpenLibrary,
  onOpenSearch,
  onOpenSidebar,
}: WindowChromeProps) {
  const {
    handleClose,
    handleDragMouseDown,
    handleMinimize,
    handleToggleMaximize,
    isMaximized,
  } = useWindowChrome();

  if (!isTauri()) {
    return null;
  }

  return createPortal(
    <>
      <div aria-hidden="true" className="window-frame-overlay" />
      <div className="window-chrome">
      <div aria-label="Loci controls" className="window-chrome-actions" role="group">
        <button
          aria-expanded={isSidebarOpen}
          aria-label="Open library sidebar"
          className="window-chrome-action"
          onClick={onOpenSidebar}
          type="button"
        >
          <PanelLeft aria-hidden size={16} strokeWidth={1.5} />
        </button>
        <button
          aria-label={isCreating ? 'Creating note' : 'New note'}
          className="window-chrome-action"
          disabled={!canCreate || isCreating}
          onClick={onCreateNote}
          type="button"
        >
          <Plus aria-hidden size={16} strokeWidth={1.5} />
        </button>
        <button
          aria-label="Search notes"
          className="window-chrome-action"
          onClick={onOpenSearch}
          type="button"
        >
          <Search aria-hidden size={16} strokeWidth={1.5} />
        </button>
        <button
          aria-label="Back"
          className="window-chrome-action"
          disabled={!canGoBack}
          onClick={onGoBack}
          type="button"
        >
          <ChevronLeft aria-hidden size={18} strokeWidth={1.5} />
        </button>
        <button
          aria-label="Forward"
          className="window-chrome-action"
          disabled={!canGoForward}
          onClick={onGoForward}
          type="button"
        >
          <ChevronRight aria-hidden size={18} strokeWidth={1.5} />
        </button>
        <div aria-label="Loci views" className="window-chrome-context" role="group">
          <button
            aria-label="Open library"
            className="window-chrome-context-action"
            onClick={onOpenLibrary}
            type="button"
          >
            <Library aria-hidden size={16} strokeWidth={1.5} />
          </button>
          <button
            aria-label="Open bookmarks"
            className="window-chrome-context-action"
            onClick={onOpenBookmarks}
            type="button"
          >
            <Bookmark aria-hidden size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div
        aria-hidden
        className="window-chrome-drag"
        onMouseDown={handleDragMouseDown}
      />
      <div aria-label="Window controls" className="window-chrome-controls" role="group">
        <button
          aria-label="Minimize"
          className="window-control"
          onClick={handleMinimize}
          type="button"
        >
          <Minus aria-hidden size={16} strokeWidth={1.5} />
        </button>
        <button
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          className="window-control"
          onClick={handleToggleMaximize}
          type="button"
        >
          {isMaximized ? (
            <Copy aria-hidden size={16} strokeWidth={1.5} />
          ) : (
            <Square aria-hidden size={15} strokeWidth={1.5} />
          )}
        </button>
        <button
          aria-label="Close"
          className="window-control"
          onClick={handleClose}
          type="button"
        >
          <X aria-hidden size={16} strokeWidth={1.5} />
        </button>
      </div>
      </div>
    </>,
    document.body,
  );
}
