import { PanelLeft } from 'lucide-react';

type ShellSidebarTriggerProps = {
  isOpen: boolean;
  onOpen: () => void;
};

export default function ShellSidebarTrigger({ isOpen, onOpen }: ShellSidebarTriggerProps) {
  return (
    <div aria-label="Loci Notepad app menu" className="shell-sidebar-trigger">
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
    </div>
  );
}
