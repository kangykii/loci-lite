// One job: dispatch plugin lifecycle hooks for every installed plugin.

import { dispatchHook } from '../plugins/registry';

export function dispatchNoteOpen(fileId: string): void {
  void dispatchHook('onNoteOpen', fileId);
}

export function dispatchNoteClose(fileId: string, wordCount: number): void {
  void dispatchHook('onNoteClose', fileId, wordCount);
}

export function dispatchBookmarkCreated(bookmark: {
  text: string;
  type: string;
}): void {
  void dispatchHook('onBookmark', bookmark);
}
