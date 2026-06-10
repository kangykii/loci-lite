// One job: in-memory snapshot of the last remote session sync.

import type { RemoteProfile } from '../store/remote.store';

export type RemoteSessionSnapshot = {
  profile: RemoteProfile | null;
  entitlements: string[];
  cosmetics: string[];
};

let snapshot: RemoteSessionSnapshot = {
  profile: null,
  entitlements: [],
  cosmetics: [],
};

export function getRemoteSessionSnapshot(): RemoteSessionSnapshot {
  return snapshot;
}

export function setRemoteSessionSnapshot(next: RemoteSessionSnapshot): void {
  snapshot = next;
}

export function getCachedEntitlements(): string[] {
  return snapshot.entitlements;
}
