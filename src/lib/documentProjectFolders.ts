import type { SearchableDocument } from '../hooks/useSearchableDocuments';

export const DEFAULT_PROJECT_FOLDER_NAME = 'Project';

export type DocumentProjectItem = {
  representative: SearchableDocument;
  members: SearchableDocument[];
  projectCount: number;
};

export type DocumentProjectMergePlan = {
  noop: boolean;
  groupLabel?: string;
  memberIds?: string[];
};

export function resolveProjectFolderName(stored: string | null | undefined): string {
  const trimmed = stored?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_PROJECT_FOLDER_NAME;
}

function getProjectMembers(
  documents: SearchableDocument[],
  document: SearchableDocument,
): SearchableDocument[] {
  if (!document.projectGroupLabel) {
    return [document];
  }

  return documents.filter((entry) => entry.projectGroupLabel === document.projectGroupLabel);
}

export function computeDocumentProjectMerge(
  documents: SearchableDocument[],
  draggedId: string,
  targetId: string,
): DocumentProjectMergePlan {
  if (draggedId === targetId) {
    return { noop: true };
  }

  const dragged = documents.find((entry) => entry.id === draggedId);
  const target = documents.find((entry) => entry.id === targetId);

  if (!dragged || !target) {
    return { noop: true };
  }

  const draggedLabel = dragged.projectGroupLabel;
  const targetLabel = target.projectGroupLabel;

  if (draggedLabel && targetLabel && draggedLabel === targetLabel) {
    return { noop: true };
  }

  const draggedMembers = getProjectMembers(documents, dragged);
  const targetMembers = getProjectMembers(documents, target);
  const memberIds = [
    ...new Set([...draggedMembers.map((entry) => entry.id), ...targetMembers.map((entry) => entry.id)]),
  ];

  return {
    noop: false,
    groupLabel: targetLabel ?? draggedLabel ?? crypto.randomUUID(),
    memberIds,
  };
}

export function buildDocumentProjectItems(
  documents: SearchableDocument[],
): DocumentProjectItem[] {
  const groups = new Map<string, SearchableDocument[]>();

  for (const document of documents) {
    const key = document.projectGroupLabel ?? document.id;
    groups.set(key, [...(groups.get(key) ?? []), document]);
  }

  return [...groups.values()].map((members) => {
    const sorted = [...members].sort((left, right) => {
      const pinned = Number(right.pinned) - Number(left.pinned);
      return pinned || left.title.localeCompare(right.title);
    });

    return {
      representative: sorted[0],
      members: sorted,
      projectCount: sorted.length,
    };
  });
}
