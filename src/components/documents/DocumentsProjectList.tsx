import { useMemo, useState, type MouseEvent } from 'react';
import { useProjectFolderNames } from '../../hooks/useProjectFolderNames';
import { useStagedProjectItems } from '../../hooks/useStagedProjectItems';
import {
  buildDocumentProjectItems,
  type DocumentProjectItem,
} from '../../lib/documentProjectFolders';
import { matchesSearch } from '../../lib/searchMatch';
import type { SearchableDocument } from '../../hooks/useSearchableDocuments';
import DocumentProjectControls, { type ProjectMenuTarget } from './DocumentProjectControls';
import DocumentsProjectRows from './DocumentsProjectRows';

type DocumentsProjectListProps = {
  canCreate: boolean;
  documents: SearchableDocument[];
  isCreating?: boolean;
  onContextMenu: (event: MouseEvent, document: SearchableDocument) => void;
  onCreateNote: () => void;
  onDissolveProject: (memberIds: string[], groupLabel: string) => void;
  onOpenEditor: (fileId: string) => void;
  onProjectDrop: (draggedId: string, targetId: string) => void;
  onRemoveFromProject: (fileId: string) => void;
  searchQuery: string;
};

export default function DocumentsProjectList({
  canCreate,
  documents,
  isCreating,
  onContextMenu,
  onCreateNote,
  onDissolveProject,
  onOpenEditor,
  onProjectDrop,
  onRemoveFromProject,
  searchQuery,
}: DocumentsProjectListProps) {
  const [menu, setMenu] = useState<ProjectMenuTarget | null>(null);
  const [renameProject, setRenameProject] = useState<ProjectMenuTarget | null>(null);
  const [deleteProject, setDeleteProject] = useState<ProjectMenuTarget | null>(null);
  const hasActiveSearch = searchQuery.trim().length > 0;
  const projectItems = useMemo(() => {
    const items = buildDocumentProjectItems(documents);
    if (!hasActiveSearch) return items;
    return items.filter((item) =>
      item.members.some((document) => matchesSearch(document.haystack, searchQuery)),
    );
  }, [documents, hasActiveSearch, searchQuery]);
  const groupLabels = useMemo(
    () => projectItems.map((item) => item.representative.projectGroupLabel).filter(Boolean) as string[],
    [projectItems],
  );
  const { names, renameProjectFolder } = useProjectFolderNames(groupLabels);
  const { displayedItems, isLeaving } = useStagedProjectItems(searchQuery, projectItems);

  return (
    <>
      <DocumentsProjectRows
        canCreate={canCreate}
        displayedItems={displayedItems}
        documents={documents}
        isCreating={isCreating}
        isLeaving={isLeaving}
        names={names}
        onContextMenu={onContextMenu}
        onCreateNote={onCreateNote}
        onOpenEditor={onOpenEditor}
        onOpenProjectMenu={openProjectMenu}
        onProjectDrop={onProjectDrop}
        onRemoveFromProject={onRemoveFromProject}
      />
      <DocumentProjectControls
        deleteProject={deleteProject}
        menu={menu}
        renameProject={renameProject}
        onCancelDelete={() => setDeleteProject(null)}
        onCancelRename={() => setRenameProject(null)}
        onCloseMenu={() => setMenu(null)}
        onConfirmDelete={confirmDeleteProject}
        onOpenDelete={setDeleteProject}
        onOpenRename={setRenameProject}
        onRename={renameSelectedProject}
      />
    </>
  );

  function openRenameDialog(item: DocumentProjectItem, displayName: string) {
    setRenameProject({ displayName, item, x: 0, y: 0 });
  }
  function openDeleteDialog(item: DocumentProjectItem, displayName: string) {
    setDeleteProject({ displayName, item, x: 0, y: 0 });
  }
  function renameSelectedProject(name: string) {
    const groupLabel = renameProject?.item.representative.projectGroupLabel;
    if (!groupLabel) return;
    void renameProjectFolder(groupLabel, name);
    setRenameProject(null);
  }
  function confirmDeleteProject() {
    const groupLabel = deleteProject?.item.representative.projectGroupLabel;
    if (!deleteProject || !groupLabel) return;
    onDissolveProject(deleteProject.item.members.map((document) => document.id), groupLabel);
    setDeleteProject(null);
  }
  function openProjectMenu(event: MouseEvent, item: DocumentProjectItem, displayName: string) {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ displayName, item, x: event.clientX, y: event.clientY });
  }
}
