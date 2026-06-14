import { Bookmark, PanelLeft, Plus } from 'lucide-react';

type ShellSidebarTriggerProps = {
  canCreate: boolean;
  isCreating?: boolean;
  isOpen: boolean;
  onCreateNote: () => void;
  onOpenBookmarks: () => void;
  onOpen: () => void;
};

export default function ShellSidebarTrigger({
  canCreate,
  isCreating,
  isOpen,
  onCreateNote,
  onOpen,
  onOpenBookmarks,
}: ShellSidebarTriggerProps) {
  return (
    <div aria-label="Loci Notepad actions" className="shell-sidebar-trigger">
      <div aria-hidden="true" className="shell-sidebar-edge-pull shell-sidebar-edge-pull-left" />
      <div aria-hidden="true" className="shell-sidebar-edge-pull shell-sidebar-edge-pull-right" />
      <button
        aria-expanded={isOpen}
        aria-label="Open library sidebar"
        className="shell-sidebar-trigger-button"
        onClick={onOpen}
        type="button"
      >
        <PanelLeft aria-hidden="true" size={15} strokeWidth={1.5} />
      </button>
      <button
        aria-label={isCreating ? 'Creating note' : 'New note'}
        className="shell-sidebar-trigger-button"
        disabled={!canCreate || isCreating}
        onClick={onCreateNote}
        type="button"
      >
        <Plus aria-hidden="true" size={15} strokeWidth={1.5} />
      </button>
      <button
        aria-label="Open bookmarks"
        className="shell-sidebar-trigger-button"
        onClick={onOpenBookmarks}
        type="button"
      >
        <Bookmark aria-hidden="true" size={15} strokeWidth={1.5} />
      </button>
    </div>
  );
}
