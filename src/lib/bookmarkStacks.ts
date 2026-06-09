import type { AtomRecord } from './atomTypes';

export const DEFAULT_STACK_NAME = 'Stack';

export function resolveStackDisplayName(
  stored: string | null | undefined,
): string {
  const trimmed = stored?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_STACK_NAME;
}

export type BookmarkGridItem = {
  representative: AtomRecord;
  members: AtomRecord[];
  stackCount: number;
};

export type StackMergePlan = {
  noop: boolean;
  groupLabel?: string;
  memberIds?: string[];
};

function getStackMembers(atoms: AtomRecord[], atom: AtomRecord): AtomRecord[] {
  if (!atom.groupLabel) {
    return [atom];
  }

  return atoms.filter((entry) => entry.groupLabel === atom.groupLabel);
}

export function computeStackMerge(
  atoms: AtomRecord[],
  draggedId: string,
  targetId: string,
): StackMergePlan {
  if (draggedId === targetId) {
    return { noop: true };
  }

  const dragged = atoms.find((entry) => entry.id === draggedId);
  const target = atoms.find((entry) => entry.id === targetId);

  if (!dragged || !target) {
    return { noop: true };
  }

  const draggedLabel = dragged.groupLabel;
  const targetLabel = target.groupLabel;

  if (draggedLabel && targetLabel && draggedLabel === targetLabel) {
    return { noop: true };
  }

  const draggedMembers = getStackMembers(atoms, dragged);
  const targetMembers = getStackMembers(atoms, target);
  const memberIds = [
    ...new Set([...draggedMembers.map((entry) => entry.id), ...targetMembers.map((entry) => entry.id)]),
  ];

  let groupLabel: string;

  if (targetLabel) {
    groupLabel = targetLabel;
  } else if (draggedLabel) {
    groupLabel = crypto.randomUUID();
  } else {
    groupLabel = crypto.randomUUID();
  }

  return { noop: false, groupLabel, memberIds };
}

export function shuffleAtomRecords<T extends AtomRecord>(members: T[]): T[] {
  const shuffled = [...members];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function buildBookmarkGridItems(atoms: AtomRecord[]): BookmarkGridItem[] {
  const groups = new Map<string, AtomRecord[]>();

  for (const atom of atoms) {
    const key = atom.groupLabel ?? atom.id;
    const existing = groups.get(key) ?? [];
    existing.push(atom);
    groups.set(key, existing);
  }

  const items = [...groups.values()].map((members) => {
    const sorted = [...members].sort((left, right) => left.createdAt - right.createdAt);

    return {
      representative: sorted[0],
      members: sorted,
      stackCount: members.length,
    };
  });

  return items.sort(
    (left, right) => right.representative.createdAt - left.representative.createdAt,
  );
}
