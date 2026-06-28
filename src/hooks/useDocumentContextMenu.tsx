import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import { Copy, Edit3, FolderOpen, Pin, PinOff, Trash2 } from 'lucide-react';
import ContextMenu, { type ContextMenuEntry } from '../components/ui/ContextMenu';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RenameNoteDialog from '../components/documents/RenameNoteDialog';
import { duplicateFile, revealFile } from '../lib/tauri';
import { initDb } from '../store/db';
import {
  getFileById,
  insertFile,
  setFilePinned,
  updateTitle,
} from '../store/files.store';
import { useDeleteDocument } from './useDeleteDocument';

export type DocumentMenuTarget = {
  id: string;
  title: string;
  path: string;
  pinned: boolean;
};

type UseDocumentContextMenuOptions = {
  onChanged: () => void;
  onDeleted?: (fileId: string) => void;
  onOpenDocument?: (fileId: string) => void;
};

export function useDocumentContextMenu({
  onChanged,
  onDeleted,
  onOpenDocument,
}: UseDocumentContextMenuOptions) {
  const [menu, setMenu] = useState<{ x: number; y: number; document: DocumentMenuTarget } | null>(null);
  const [renameTarget, setRenameTarget] = useState<DocumentMenuTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentMenuTarget | null>(null);
  const { remove, isDeleting, error: deleteError, clearError } = useDeleteDocument();

  const openMenu = useCallback((event: MouseEvent, document: DocumentMenuTarget) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ x: event.clientX, y: event.clientY, document });
  }, []);

  const togglePin = useCallback((document: DocumentMenuTarget) => {
    void setFilePinned(document.id, !document.pinned).then(onChanged);
  }, [onChanged]);

  const rename = useCallback((document: DocumentMenuTarget, title: string) => {
    void (async () => {
      const file = await getFileById(document.id);
      if (!file) return;
      await updateTitle(file.id, title.trim() || 'Untitled');
      setRenameTarget(null);
      onChanged();
    })();
  }, [onChanged]);

  const duplicate = useCallback((document: DocumentMenuTarget) => {
    void (async () => {
      await initDb();
      const file = await getFileById(document.id);
      if (!file) return;
      const path = await duplicateFile(file.path);
      const now = Date.now();
      const id = crypto.randomUUID();
      await insertFile({
        id,
        path,
        title: `${document.title} Copy`,
        openedAt: now,
        createdAt: now,
        editedAt: now,
        pinned: false,
        projectGroupLabel: null,
      });
      onChanged();
      onOpenDocument?.(id);
    })();
  }, [onChanged, onOpenDocument]);

  const menuItems = useMemo<ContextMenuEntry[]>(() => {
    if (!menu) return [];
    const document = menu.document;
    return [
      {
        label: document.pinned ? 'Unpin' : 'Pin',
        icon: document.pinned ? <PinOff size={16} strokeWidth={1.5} /> : <Pin size={16} strokeWidth={1.5} />,
        onClick: () => togglePin(document),
      },
      { kind: 'separator' },
      { label: 'Rename', icon: <Edit3 size={16} strokeWidth={1.5} />, onClick: () => setRenameTarget(document) },
      { label: 'Duplicate', icon: <Copy size={16} strokeWidth={1.5} />, onClick: () => duplicate(document) },
      { kind: 'separator' },
      { label: 'Reveal in Finder', icon: <FolderOpen size={16} strokeWidth={1.5} />, onClick: () => void revealFile(document.path) },
      { kind: 'separator' },
      { label: 'Delete', icon: <Trash2 size={16} strokeWidth={1.5} />, destructive: true, onClick: () => { clearError(); setDeleteTarget(document); } },
    ];
  }, [clearError, duplicate, menu, togglePin]);

  const element = (
    <>
      {menu ? <ContextMenu items={menuItems} onClose={() => setMenu(null)} x={menu.x} y={menu.y} /> : null}
      <RenameNoteDialog
        initialTitle={renameTarget?.title ?? ''}
        isOpen={renameTarget !== null}
        onCancel={() => setRenameTarget(null)}
        onRename={(title) => rename(renameTarget as DocumentMenuTarget, title)}
      />
      <ConfirmDialog
        error={deleteError}
        isConfirming={isDeleting}
        isOpen={deleteTarget !== null}
        message={deleteTarget ? `Delete "${deleteTarget.title}"? This permanently removes the note and all bookmarks in it.` : ''}
        onCancel={() => { clearError(); setDeleteTarget(null); }}
        onConfirm={() => {
          if (!deleteTarget) return;
          void remove(deleteTarget.id).then(() => {
            onDeleted?.(deleteTarget.id);
            setDeleteTarget(null);
            onChanged();
          });
        }}
        title="Delete note?"
      />
    </>
  );

  return { openMenu, element };
}
