import { invoke, isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

export { isTauri };

function appWindow() {
  return getCurrentWindow();
}

export async function getNotesDir(): Promise<string> {
  return invoke<string>('get_notes_dir');
}

export async function createNote(slug: string, initialContents: string): Promise<string> {
  return invoke<string>('create_note', { slug, initialContents });
}

export async function readFile(path: string): Promise<string> {
  return invoke<string>('read_file', { path });
}

export async function writeFile(path: string, contents: string): Promise<void> {
  return invoke('write_file', { path, contents });
}

export async function deleteFile(path: string): Promise<void> {
  return invoke('delete_file', { path });
}

export async function minimizeWindow(): Promise<void> {
  if (!isTauri()) {
    return;
  }
  await appWindow().minimize();
}

export async function toggleMaximizeWindow(): Promise<void> {
  if (!isTauri()) {
    return;
  }
  await appWindow().toggleMaximize();
}

export async function closeWindow(): Promise<void> {
  if (!isTauri()) {
    return;
  }
  await appWindow().close();
}

export async function isWindowMaximized(): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }
  return appWindow().isMaximized();
}

export async function startWindowDrag(): Promise<void> {
  if (!isTauri()) {
    return;
  }
  await appWindow().startDragging();
}

export function onWindowResized(callback: () => void): Promise<() => void> {
  if (!isTauri()) {
    return Promise.resolve(() => {});
  }
  return appWindow().onResized(callback);
}
