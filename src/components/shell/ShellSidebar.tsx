import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Theme } from '../../lib/theme';
import type { ViewName } from '../../hooks/useViewTransition';
import ShellSidebarLibrary from './ShellSidebarLibrary';
import ShellSidebarNav from './ShellSidebarNav';

export type SidebarPhase = 'entering' | 'idle' | 'leaving' | 'closed';

type ShellSidebarProps = {
  activeView: ViewName;
  isOpen: boolean;
  isCreating?: boolean;
  libraryRevision: number;
  theme: Theme;
  onClose: () => void;
  onCreateNote: () => void;
  onGoHome: () => void;
  onOpenBookmarks: () => void;
  onOpenDocument: (fileId: string) => void;
  onOpenDocumentsPage: () => void;
  onOpenSettings: () => void;
  onPhaseChange?: (phase: SidebarPhase) => void;
  onThemeToggle: () => void;
};

export default function ShellSidebar({
  activeView,
  isOpen,
  isCreating,
  libraryRevision,
  theme,
  onClose,
  onCreateNote,
  onGoHome,
  onOpenBookmarks,
  onOpenDocument,
  onOpenDocumentsPage,
  onOpenSettings,
  onPhaseChange,
  onThemeToggle,
}: ShellSidebarProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [phase, setPhase] = useState<SidebarPhase>(isOpen ? 'entering' : 'closed');
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [onPhaseChange, phase]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setPhase('entering');
      window.requestAnimationFrame(() => panelRef.current?.focus());
      return;
    }

    if (shouldRender) {
      setPhase('leaving');
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (document.body.classList.contains('focus-mode-active') && isOpen) {
      onClose();
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('focus-mode-active') && isOpen) {
        onClose();
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [isOpen, onClose]);

  if (!shouldRender) {
    return null;
  }

  return createPortal(
    <div className="shell-sidebar-layer" data-state={phase} role="presentation">
      <button
        aria-label="Close sidebar"
        className="shell-sidebar-scrim"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Library sidebar"
        aria-modal="true"
        className="shell-sidebar-panel"
        data-state={phase}
        data-transition="sidebar"
        onAnimationEnd={(event) => {
          if (event.currentTarget !== event.target) {
            return;
          }

          if (phase === 'leaving') {
            setShouldRender(false);
            setPhase('closed');
          } else if (phase === 'entering') {
            setPhase('idle');
          }
        }}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <ShellSidebarNav
          activeView={activeView}
          isCreating={isCreating}
          onCreateNote={onCreateNote}
          onGoHome={onGoHome}
          onOpenBookmarks={onOpenBookmarks}
          onOpenSettings={onOpenSettings}
          onThemeToggle={onThemeToggle}
          placement="primary"
          theme={theme}
        />
        <ShellSidebarLibrary
          isOpen={isOpen}
          listRefreshKey={libraryRevision}
          onOpenDocument={onOpenDocument}
          onOpenDocumentsPage={onOpenDocumentsPage}
        />
        <ShellSidebarNav
          activeView={activeView}
          onGoHome={onGoHome}
          onOpenBookmarks={onOpenBookmarks}
          onOpenSettings={onOpenSettings}
          onThemeToggle={onThemeToggle}
          placement="secondary"
          theme={theme}
        />
      </aside>
    </div>,
    document.body,
  );
}
