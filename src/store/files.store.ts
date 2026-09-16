import { invoke } from '@tauri-apps/api/core';

export type FileRecord = {
  id: string;
  path: string;
  title: string | null;
  openedAt: number;
  createdAt: number;
  editedAt: number;
  pinned: boolean;
  projectGroupLabel: string | null;
};

export async function insertFile(record: FileRecord): Promise<void> {
  await invoke('insert_file', { record });
}

export async function getFileById(id: string): Promise<FileRecord | null> {
  return invoke<FileRecord | null>('get_file_by_id', { id });
}

export async function touchOpenedAt(id: string, openedAt: number): Promise<void> {
  await invoke('touch_opened_at', { id, openedAt });
}

/** Combines `getFileById` + `touchOpenedAt` into one IPC round trip for the note-open path. */
export async function openFile(id: string, openedAt: number): Promise<FileRecord | null> {
  return invoke<FileRecord | null>('open_file', { id, openedAt });
}

export async function touchEditedAt(id: string, editedAt: number): Promise<void> {
  await invoke('touch_edited_at', { id, editedAt });
}

export async function updateTitle(id: string, title: string | null): Promise<void> {
  await invoke('update_title', { id, title });
}

export async function setFilePinned(id: string, pinned: boolean): Promise<void> {
  await invoke('set_file_pinned', { id, pinned });
}

export async function updateFilesProjectGroupLabel(
  ids: string[],
  projectGroupLabel: string | null,
): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await invoke('update_files_project_group_label', { ids, projectGroupLabel });
}

export async function clearSingletonProjectGroupLabel(groupLabel: string): Promise<void> {
  await invoke('clear_singleton_project_group_label', { groupLabel });
}

export async function listRecentFiles(limit: number): Promise<FileRecord[]> {
  return invoke<FileRecord[]>('list_recent_files', { limit });
}

export async function listAllFiles(): Promise<FileRecord[]> {
  return invoke<FileRecord[]>('list_all_files');
}

export async function listFilesByEditedAt(): Promise<FileRecord[]> {
  return invoke<FileRecord[]>('list_files_by_edited_at');
}

export async function deleteFile(id: string): Promise<void> {
  await invoke('delete_file_record', { id });
}
