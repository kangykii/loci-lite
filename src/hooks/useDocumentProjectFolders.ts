import { useCallback } from 'react';
import { computeDocumentProjectMerge } from '../lib/documentProjectFolders';
import { initDb } from '../store/db';
import {
  clearSingletonProjectGroupLabel,
  updateFilesProjectGroupLabel,
} from '../store/files.store';
import { deleteProjectFolderName } from '../store/projectFolderNames.store';
import type { SearchableDocument } from './useSearchableDocuments';

type UseDocumentProjectFoldersOptions = {
  documents: SearchableDocument[];
  onChanged: () => Promise<void> | void;
};

export function useDocumentProjectFolders({
  documents,
  onChanged,
}: UseDocumentProjectFoldersOptions) {
  const groupDocuments = useCallback(
    async (draggedId: string, targetId: string) => {
      const plan = computeDocumentProjectMerge(documents, draggedId, targetId);

      if (plan.noop || !plan.groupLabel || !plan.memberIds) {
        return;
      }

      await initDb();
      await updateFilesProjectGroupLabel(plan.memberIds, plan.groupLabel);
      await onChanged();
    },
    [documents, onChanged],
  );

  const removeDocumentFromProject = useCallback(
    async (fileId: string) => {
      const document = documents.find((entry) => entry.id === fileId);
      if (!document?.projectGroupLabel) return;

      await initDb();
      await updateFilesProjectGroupLabel([fileId], null);
      await clearSingletonProjectGroupLabel(document.projectGroupLabel);
      await onChanged();
    },
    [documents, onChanged],
  );

  const dissolveProject = useCallback(
    async (memberIds: string[], groupLabel: string) => {
      await initDb();
      await updateFilesProjectGroupLabel(memberIds, null);
      await deleteProjectFolderName(groupLabel);
      await onChanged();
    },
    [onChanged],
  );

  return { dissolveProject, groupDocuments, removeDocumentFromProject };
}
