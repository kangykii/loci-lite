import type { MouseEvent } from 'react';
import type { DocumentProjectItem } from '../../lib/documentProjectFolders';
import DocumentProjectFolder from './DocumentProjectFolder';
import DocumentProjectMemberRow from './DocumentProjectMemberRow';

type DocumentProjectGroupProps = {
  canDrag: boolean;
  displayName: string;
  index: number;
  isExpanded: boolean;
  item: DocumentProjectItem;
  onContextMenu: (event: MouseEvent, item: DocumentProjectItem, displayName: string) => void;
  onOpenDocument: (fileId: string) => void;
  onProjectDrop: (draggedId: string, targetId: string) => void;
  onToggle: () => void;
};

export default function DocumentProjectGroup({
  canDrag,
  displayName,
  index,
  isExpanded,
  item,
  onContextMenu,
  onOpenDocument,
  onProjectDrop,
  onToggle,
}: DocumentProjectGroupProps) {
  return (
    <>
      <DocumentProjectFolder
        canDrag={canDrag}
        displayName={displayName}
        index={index}
        isExpanded={isExpanded}
        item={item}
        onContextMenu={onContextMenu}
        onProjectDrop={onProjectDrop}
        onToggle={onToggle}
      />
      {isExpanded
        ? item.members.map((document, memberIndex) => (
            <DocumentProjectMemberRow
              displayName={displayName}
              document={document}
              index={index + memberIndex + 1}
              key={document.id}
              onOpenDocument={onOpenDocument}
            />
          ))
        : null}
    </>
  );
}
