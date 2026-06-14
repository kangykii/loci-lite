import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import RenameNoteDialog from '../components/documents/RenameNoteDialog';
import ContextMenu, { type ContextMenuEntry } from '../components/ui/ContextMenu';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { AtomRecord } from '../lib/atomTypes';
import type { BookmarkGridItem } from '../lib/bookmarkStacks';

type MenuTarget =
  | { kind: 'atom'; x: number; y: number; atom: AtomRecord }
  | { kind: 'stack'; x: number; y: number; item: BookmarkGridItem; displayName: string };

type PendingStackDelete = {
  ids: string[];
  name: string;
};

type UseBookmarkContextMenuOptions = {
  isRemoving: boolean;
  deleteError: string | null;
  onEditAtom: (id: string) => void;
  onDeleteAtom: (id: string, sourceText: string) => void;
  onRenameStack: (groupLabel: string, name: string) => void;
  onDeleteStack: (ids: string[], name: string) => void;
  onClearDeleteError: () => void;
};

export function useBookmarkContextMenu({
  isRemoving,
  deleteError,
  onEditAtom,
  onDeleteAtom,
  onRenameStack,
  onDeleteStack,
  onClearDeleteError,
}: UseBookmarkContextMenuOptions) {
  const [menu, setMenu] = useState<MenuTarget | null>(null);
  const [renameStack, setRenameStack] = useState<MenuTarget & { kind: 'stack' } | null>(null);
  const [deleteStack, setDeleteStack] = useState<PendingStackDelete | null>(null);

  const openAtomMenu = useCallback((event: MouseEvent, atom: AtomRecord) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ kind: 'atom', x: event.clientX, y: event.clientY, atom });
  }, []);

  const openStackMenu = useCallback(
    (event: MouseEvent, item: BookmarkGridItem, displayName: string) => {
      event.preventDefault();
      event.stopPropagation();
      setMenu({ kind: 'stack', x: event.clientX, y: event.clientY, item, displayName });
    },
    [],
  );

  const items = useMemo<ContextMenuEntry[]>(() => {
    if (!menu) return [];
    if (menu.kind === 'atom') {
      return [
        { label: 'Edit', icon: <Edit3 size={16} strokeWidth={1.5} />, onClick: () => onEditAtom(menu.atom.id) },
        { kind: 'separator' },
        { label: 'Delete', icon: <Trash2 size={16} strokeWidth={1.5} />, destructive: true, onClick: () => onDeleteAtom(menu.atom.id, menu.atom.sourceText) },
      ];
    }

    return [
      { label: 'Rename', icon: <Edit3 size={16} strokeWidth={1.5} />, onClick: () => setRenameStack(menu) },
      { kind: 'separator' },
      {
        label: 'Delete stack',
        icon: <Trash2 size={16} strokeWidth={1.5} />,
        destructive: true,
        onClick: () => {
          onClearDeleteError();
          setDeleteStack({ ids: menu.item.members.map((atom) => atom.id), name: menu.displayName });
        },
      },
    ];
  }, [menu, onClearDeleteError, onDeleteAtom, onEditAtom]);

  const element = (
    <>
      {menu ? <ContextMenu items={items} onClose={() => setMenu(null)} x={menu.x} y={menu.y} /> : null}
      <RenameNoteDialog
        dialogTitle="Rename stack"
        initialTitle={renameStack?.displayName ?? ''}
        isOpen={renameStack !== null}
        label="Stack name"
        onCancel={() => setRenameStack(null)}
        onRename={(name) => {
          const target = renameStack;
          if (!target?.item.representative.groupLabel) return;
          onRenameStack(target.item.representative.groupLabel, name);
          setRenameStack(null);
        }}
      />
      <ConfirmDialog
        error={deleteError}
        isConfirming={isRemoving}
        isOpen={deleteStack !== null}
        message={deleteStack ? `Delete "${deleteStack.name}"? This removes every bookmark in the stack.` : ''}
        onCancel={() => {
          onClearDeleteError();
          setDeleteStack(null);
        }}
        onConfirm={() => {
          if (!deleteStack) return;
          onDeleteStack(deleteStack.ids, deleteStack.name);
          setDeleteStack(null);
        }}
        title="Delete stack?"
      />
    </>
  );

  return { openAtomMenu, openStackMenu, element };
}
