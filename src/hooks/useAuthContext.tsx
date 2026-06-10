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
  profile: RemoteProfile | null;
  refreshProfile: () => Promise<void>;
  renameProfile: (displayName: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [profile, setProfile] = useState<RemoteProfile | null>(
    () => getRemoteSessionSnapshot().profile,
  );

  const refreshProfile = useCallback(async () => {
    const next = await syncRemoteProfile();
    setProfile(next.profile);
  }, []);

  useEffect(() => {
    if (auth.state === 'authenticated') {
      void refreshProfile();
      return;
    }
    if (auth.state === 'anonymous') {
      setRemoteSessionSnapshot({ profile: null, entitlements: [], cosmetics: [] });
      setProfile(null);
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
    () => ({ ...auth, profile, refreshProfile, renameProfile }),
    [auth, profile, refreshProfile, renameProfile],
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
