import { useCallback, useEffect, useState } from 'react';
import {
  getSession,
  signInWithGoogle,
  signInWithMagicLink,
  signOut,
  subscribeToAuthStateChange,
  verifyEmailOtp,
} from '../lib/auth';
import { hasRemote } from '../lib/env';
import { getRemoteProfile } from '../store/remote.store';

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
        void getRemoteProfile().then((profile) => {
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

  const magicLink = useCallback(async (address: string) => signInWithMagicLink(address), []);

  const verifyCode = useCallback(
    async (address: string, token: string) => verifyEmailOtp(address, token),
    [],
  );

  const google = useCallback(async () => signInWithGoogle(), []);

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
    signInWithMagicLink: magicLink,
    verifyEmailCode: verifyCode,
    signInWithGoogle: google,
    signOut: logout,
  };
}
