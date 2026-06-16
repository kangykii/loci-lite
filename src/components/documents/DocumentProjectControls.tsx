import { Edit3, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import type { DocumentProjectItem } from '../../lib/documentProjectFolders';
import ConfirmDialog from '../ui/ConfirmDialog';
import ContextMenu, { type ContextMenuEntry } from '../ui/ContextMenu';
import RenameNoteDialog from './RenameNoteDialog';

export type ProjectMenuTarget = {
  displayName: string;
  item: DocumentProjectItem;
  x: number;
  y: number;
};

type DocumentProjectControlsProps = {
  deleteProject: ProjectMenuTarget | null;
  menu: ProjectMenuTarget | null;
  renameProject: ProjectMenuTarget | null;
  onCancelDelete: () => void;
  onCancelRename: () => void;
  onCloseMenu: () => void;
  onConfirmDelete: () => void;
  onOpenDelete: (target: ProjectMenuTarget) => void;
  onOpenRename: (target: ProjectMenuTarget) => void;
  onRename: (name: string) => void;
};

export default function DocumentProjectControls({
  deleteProject,
  menu,
  renameProject,
  onCancelDelete,
  onCancelRename,
  onCloseMenu,
  onConfirmDelete,
  onOpenDelete,
  onOpenRename,
  onRename,
}: DocumentProjectControlsProps) {
  const menuItems = useMemo<ContextMenuEntry[]>(
    () =>
      menu
        ? [
            { label: 'Rename', icon: <Edit3 size={16} strokeWidth={1.5} />, onClick: () => onOpenRename(menu) },
            { kind: 'separator' },
            {
              label: 'Delete project folder',
              icon: <Trash2 size={16} strokeWidth={1.5} />,
              destructive: true,
              onClick: () => onOpenDelete(menu),
            },
          ]
        : [],
    [menu, onOpenDelete, onOpenRename],
  );

  return (
    <>
      {menu ? <ContextMenu items={menuItems} onClose={onCloseMenu} x={menu.x} y={menu.y} /> : null}
      <RenameNoteDialog
        dialogTitle="Rename project"
        initialTitle={renameProject?.displayName ?? ''}
        isOpen={renameProject !== null}
        label="Project name"
        onCancel={onCancelRename}
        onRename={onRename}
      />
      <ConfirmDialog
        confirmLabel="Delete folder"
        isOpen={deleteProject !== null}
        message={deleteProject ? `Delete "${deleteProject.displayName}"? The notes stay in Documents.` : ''}
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
        title="Delete project folder?"
      />
    </>
  );
}
