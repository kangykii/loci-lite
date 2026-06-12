// One job: background-fetch remote profile, entitlements, and cosmetics.

import {
  ensureRemoteProfile,
  getPluginEntitlements,
  getUnlockedCosmetics,
} from '../store/remote.store';
import {
  setRemoteSessionSnapshot,
  type RemoteSessionSnapshot,
} from './remoteSessionCache';

export async function syncRemoteProfile(): Promise<RemoteSessionSnapshot> {
  const empty: RemoteSessionSnapshot = {
    profile: null,
    entitlements: [],
    cosmetics: [],
  };

  try {
    const [profile, entitlements, cosmetics] = await Promise.all([
      ensureRemoteProfile(),
      getPluginEntitlements(),
      getUnlockedCosmetics(),
    ]);
    const next = { profile, entitlements, cosmetics };
    setRemoteSessionSnapshot(next);
    return next;
  } catch (err) {
    console.warn('Remote session sync failed; app continues offline:', err);
    setRemoteSessionSnapshot(empty);
    return empty;
  }
}
