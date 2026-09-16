import { invoke, isTauri } from '@tauri-apps/api/core';
import { currentMonitor, getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { open as openFileDialog } from '@tauri-apps/plugin-dialog';

export { isTauri };

function appWindow() {
  return getCurrentWindow();
}

// A monitor-relative minimum keeps the frameless shell usable across display
// sizes and DPI settings; split view has its own stricter content-width gate.
export async function setAdaptiveWindowMinimum(): Promise<void> {
  if (!isTauri()) return;
  const monitor = await currentMonitor();
  if (!monitor) return;
  await appWindow().setMinSize(new LogicalSize(
    Math.round((monitor.workArea.size.width / monitor.scaleFactor) * 0.48),
    Math.round((monitor.workArea.size.height / monitor.scaleFactor) * 0.48),
  ));
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

export async function duplicateFile(path: string): Promise<string> {
  return invoke<string>('duplicate_file', { path });
}

export async function revealFile(path: string): Promise<void> {
  return invoke('reveal_file', { path });
}

export async function lookupWord(text: string): Promise<boolean> {
  return invoke<boolean>('lookup_word', { text });
}

export async function pickPdfFile(): Promise<string | null> {
  if (!isTauri()) {
    return null;
  }

  const selected = await openFileDialog({
    multiple: false,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });

  return typeof selected === 'string' ? selected : null;
}

export type ExtractResult = {
  title: string | null;
  text: string;
};

export async function extractPdfText(path: string): Promise<string> {
  return invoke<string>('extract_pdf_text', { path });
}

export async function extractPdfBytes(bytes: Uint8Array): Promise<string> {
  return invoke<string>('extract_pdf_bytes', { bytes: Array.from(bytes) });
}

export async function extractUrlText(url: string): Promise<ExtractResult> {
  return invoke<ExtractResult>('extract_url_text', { url });
}

export async function extractPastedText(raw: string): Promise<ExtractResult> {
  return invoke<ExtractResult>('extract_pasted_text', { raw });
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
