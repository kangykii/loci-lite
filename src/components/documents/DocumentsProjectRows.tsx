import { useMemo, useState, type DragEvent, type MouseEvent } from 'react';
import { getActiveBrowseDragPayload } from '../../lib/browseDrag';
import { readDragPayload } from '../../lib/deletePayload';
import { resolveProjectFolderName, type DocumentProjectItem } from '../../lib/documentProjectFolders';
import type { SearchableDocument } from '../../hooks/useSearchableDocuments';
import DocumentCreateCard from './DocumentCreateCard';
import DocumentProjectGroup from './DocumentProjectGroup';
import DocumentRow from './DocumentRow';

type DocumentsProjectRowsProps = {
  canCreate: boolean;
  displayedItems: DocumentProjectItem[];
  documents: SearchableDocument[];
  isCreating?: boolean;
  isLeaving: boolean;
  names: Record<string, string>;
  onContextMenu: (event: MouseEvent, document: SearchableDocument) => void;
  onCreateNote: () => void;
  onOpenEditor: (fileId: string) => void;
  onOpenProjectMenu: (event: MouseEvent, item: DocumentProjectItem, displayName: string) => void;
  onProjectDrop: (draggedId: string, targetId: string) => void;
  onRemoveFromProject: (fileId: string) => void;
};

export default function DocumentsProjectRows({
  canCreate,
  displayedItems,
  documents,
  isCreating,
  isLeaving,
  names,
  onContextMenu,
  onCreateNote,
  onOpenEditor,
  onOpenProjectMenu,
  onProjectDrop,
  onRemoveFromProject,
}: DocumentsProjectRowsProps) {
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(() => new Set());
  const projectMemberIds = useMemo(
    () => new Set(documents.filter((document) => document.projectGroupLabel).map((document) => document.id)),
    [documents],
  );

  return (
    <div
      className={`documents-list${isLeaving ? ' leaving' : ''}`}
      data-stagger
      onDragOver={handleListDragOver}
      onDrop={handleListDrop}
    >
      {displayedItems.map((item, index) => renderProjectItem(item, index))}
      <DocumentCreateCard canCreate={canCreate} isCreating={isCreating} onCreateNote={onCreateNote} />
    </div>
  );

  function canRemoveActiveDrag() {
    const active = getActiveBrowseDragPayload();
    return active?.kind === 'document' && projectMemberIds.has(active.id);
  }

  function handleListDragOver(event: DragEvent<HTMLDivElement>) {
    if (!canRemoveActiveDrag()) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleListDrop(event: DragEvent<HTMLDivElement>) {
    const payload = readDragPayload(event.dataTransfer);
    if (payload?.kind !== 'document' || !projectMemberIds.has(payload.id)) return;
    event.preventDefault();
    onRemoveFromProject(payload.id);
  }

  function toggleProject(groupLabel: string) {
    setExpandedLabels((current) => {
      const next = new Set(current);
      if (next.has(groupLabel)) next.delete(groupLabel);
      else next.add(groupLabel);
      return next;
    });
  }

  function renderProjectItem(item: DocumentProjectItem, index: number) {
    const groupLabel = item.representative.projectGroupLabel;
    if (item.projectCount >= 2 && groupLabel) {
      const displayName = resolveProjectFolderName(names[groupLabel]);
      return (
        <DocumentProjectGroup
          canDrag={canCreate}
          displayName={displayName}
          index={index}
          isExpanded={expandedLabels.has(groupLabel)}
          item={item}
          key={groupLabel}
          onContextMenu={onOpenProjectMenu}
          onOpenDocument={onOpenEditor}
          onProjectDrop={onProjectDrop}
          onToggle={() => toggleProject(groupLabel)}
        />
      );
    }

    return (
      <DocumentRow
        canDrag={canCreate}
        document={item.representative}
        index={index}
        key={item.representative.id}
        onContextMenu={onContextMenu}
        onOpen={onOpenEditor}
        onProjectDrop={onProjectDrop}
      />
    );
  }
}
