// One job: dispatch plugin lifecycle hooks using cached entitlements.

import { dispatchHook } from '../plugins/registry';
import { getCachedEntitlements } from './remoteSessionCache';

export function dispatchNoteOpen(fileId: string): void {
  void dispatchHook('onNoteOpen', getCachedEntitlements(), fileId);
}

export function dispatchNoteClose(fileId: string, wordCount: number): void {
  void dispatchHook('onNoteClose', getCachedEntitlements(), fileId, wordCount);
}

export function dispatchBookmarkCreated(bookmark: {
  text: string;
  type: string;
}): void {
  void dispatchHook('onBookmark', getCachedEntitlements(), bookmark);
}
