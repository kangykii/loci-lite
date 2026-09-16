import { invoke } from '@tauri-apps/api/core';
import type { AtomRecord, AtomType, CreateAtomInput } from '../lib/atomTypes';

export type { AtomRecord, AtomType };

export async function createAtom(input: CreateAtomInput): Promise<AtomRecord> {
  return invoke<AtomRecord>('create_atom', { input });
}

export async function getAtomsForFile(fileId: string): Promise<AtomRecord[]> {
  return invoke<AtomRecord[]>('get_atoms_for_file', { fileId });
}

export async function getVisibleAtomsForFile(fileId: string): Promise<AtomRecord[]> {
  return invoke<AtomRecord[]>('get_visible_atoms_for_file', { fileId });
}

export async function getDefinitionAtoms(): Promise<AtomRecord[]> {
  return invoke<AtomRecord[]>('get_definition_atoms');
}

export async function getAtomById(id: string): Promise<AtomRecord | null> {
  return invoke<AtomRecord | null>('get_atom_by_id', { id });
}

export async function deleteAtom(id: string): Promise<void> {
  await invoke('delete_atom', { id });
}

export async function updateAtom(
  id: string,
  patch: {
    type: AtomType;
    answer: string;
    sourceText?: string;
    reminderDueAt?: number | null;
  },
): Promise<void> {
  await invoke('update_atom', { id, patch });
}

export async function updateAtomsGroupLabel(
  ids: string[],
  groupLabel: string | null,
): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await invoke('update_atoms_group_label', { ids, groupLabel });
}

export async function getAtomsByGroupLabel(groupLabel: string): Promise<AtomRecord[]> {
  return invoke<AtomRecord[]>('get_atoms_by_group_label', { groupLabel });
}

export async function clearSingletonGroupLabel(groupLabel: string): Promise<void> {
  await invoke('clear_singleton_group_label', { groupLabel });
}

export async function listAllAtoms(): Promise<AtomRecord[]> {
  return invoke<AtomRecord[]>('list_all_atoms');
}

export async function listDueUnsurfacedReminders(now: number): Promise<AtomRecord[]> {
  return invoke<AtomRecord[]>('list_due_unsurfaced_reminders', { now });
}

export async function markRemindersSurfaced(
  ids: string[],
  surfacedAt: number,
): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await invoke('mark_reminders_surfaced', { ids, surfacedAt });
}
