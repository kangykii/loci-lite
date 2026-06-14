// One job: share a single auth session + remote profile across the UI.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getRemoteSessionSnapshot,
  setRemoteSessionSnapshot,
} from '../lib/remoteSessionCache';
import { syncRemoteProfile } from '../lib/syncRemoteProfile';
import { updateRemoteDisplayName, type RemoteProfile } from '../store/remote.store';
import { useAuth } from './useAuth';

type AuthContextValue = ReturnType<typeof useAuth> & {
  cosmetics: string[];
  profile: RemoteProfile | null;
  profileReady: boolean;
  refreshProfile: () => Promise<void>;
  renameProfile: (displayName: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [profile, setProfile] = useState<RemoteProfile | null>(
    () => getRemoteSessionSnapshot().profile,
  );
  const [cosmetics, setCosmetics] = useState<string[]>(() => getRemoteSessionSnapshot().cosmetics);
  const [profileReady, setProfileReady] = useState(false);

  const refreshProfile = useCallback(async () => {
    const next = await syncRemoteProfile();
    setProfile(next.profile);
    setCosmetics(next.cosmetics);
    setProfileReady(true);
  }, []);

  useEffect(() => {
    if (auth.state === 'authenticated') {
      setProfileReady(false);
      void refreshProfile();
      return;
    }
    if (auth.state === 'anonymous') {
      setRemoteSessionSnapshot({ profile: null, entitlements: [], cosmetics: [] });
      setProfile(null);
      setCosmetics([]);
      setProfileReady(false);
    }
  }, [auth.state, auth.userId, refreshProfile]);

  const renameProfile = useCallback(
    async (displayName: string) => {
      const trimmed = displayName.trim();
      if (!trimmed) return false;
      const ok = await updateRemoteDisplayName(trimmed);
      if (ok) {
        await refreshProfile();
      }
      return ok;
    },
    [refreshProfile],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ ...auth, cosmetics, profile, profileReady, refreshProfile, renameProfile }),
    [auth, cosmetics, profile, profileReady, refreshProfile, renameProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}
