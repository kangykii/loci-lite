import { useCallback } from 'react';

import { computeStackMerge } from '../lib/bookmarkStacks';
import type { AtomRecord } from '../lib/atomTypes';
import { initDb } from '../store/db';
import { updateAtomsGroupLabel } from '../store/atoms.store';

type UseBookmarkStacksOptions = {
  atoms: AtomRecord[];
  onStacked: () => Promise<void>;
};

export function useBookmarkStacks({ atoms, onStacked }: UseBookmarkStacksOptions) {
  const stackBookmarks = useCallback(
    async (draggedId: string, targetId: string) => {
      const plan = computeStackMerge(atoms, draggedId, targetId);

      if (plan.noop || !plan.groupLabel || !plan.memberIds) {
        return;
      }

      await initDb();
      await updateAtomsGroupLabel(plan.memberIds, plan.groupLabel);
      await onStacked();
    },
    [atoms, onStacked],
  );

  return { stackBookmarks };
}
