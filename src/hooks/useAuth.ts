import { useCallback, useEffect, useState } from 'react';
import {
  getSession,
  signInWithOTPCode,
  signInWithPassword,
  signOut,
  subscribeToAuthStateChange,
  updateAuthPassword,
  verifyOTPCode,
} from '../lib/auth';
import { hasRemote } from '../lib/env';
import { ensureRemoteProfile } from '../store/remote.store';

export type AuthState = 'loading' | 'anonymous' | 'authenticated';

export function useAuth() {
  const [state, setState] = useState<AuthState>(() => (hasRemote ? 'loading' : 'anonymous'));
  const [userId, setUserId] = useState<string | null>(null);
  const [tier, setTier] = useState<'standard' | 'modern_writer'>('standard');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!hasRemote) {
      setState('anonymous');
      return;
    }

    let cancelled = false;

    const applySession = (session: Awaited<ReturnType<typeof getSession>>) => {
      if (cancelled) return;
      if (session) {
        setState('authenticated');
        setUserId(session.user.id);
        setEmail(session.user.email ?? null);
        void ensureRemoteProfile().then((profile) => {
          if (!cancelled && profile) {
            setTier(profile.tier);
          }
        });
        return;
      }
      setState('anonymous');
      setUserId(null);
      setEmail(null);
      setTier('standard');
    };

    void getSession().then(applySession);

    const unsubscribe = subscribeToAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const sendCode = useCallback(async (email: string, shouldCreateUser = true) => {
    return signInWithOTPCode(email, shouldCreateUser);
  }, []);

  const verifyCode = useCallback(
    async (email: string, token: string) => verifyOTPCode(email, token),
    [],
  );

  const loginWithPassword = useCallback(
    async (email: string, password: string) => signInWithPassword(email, password),
    [],
  );

  const setPassword = useCallback(
    async (password: string) => updateAuthPassword(password),
    [],
  );

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  return {
    state,
    userId,
    tier,
    email,
    isAuthenticated: state === 'authenticated',
    isModernWriter: tier === 'modern_writer',
    loginWithPassword,
    sendCode,
    setPassword,
    verifyCode,
    signOut: logout,
  };
}
