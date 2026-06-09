import type { AtomType } from './atomTypes';

export const ATOM_TYPE_LABELS: Record<AtomType, string> = {
  definition: 'Definition',
  note: 'Note',
  reminder: 'Reminder',
};

export type AtomFilter = 'all' | AtomType;

export const ATOM_FILTER_OPTIONS: { id: AtomFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'definition', label: 'Definitions' },
  { id: 'note', label: 'Notes' },
  { id: 'reminder', label: 'Reminders' },
];

export const ATOM_GROUP_ORDER: AtomType[] = ['definition', 'note', 'reminder'];
