// One job: all authentication actions.
// Magic link and Google Sign In both live here.
// Never import this from components — use useAuth hook instead.

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { isTauri, openUrl, waitForOAuthCallback } from './tauri';

export type AuthStateListener = (
  event: AuthChangeEvent,
  session: Session | null,
) => void;

const OAUTH_PORT = 54321;

export async function signInWithMagicLink(email: string): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: 'No network connection' };

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'loci://auth/callback',
      shouldCreateUser: true,
    },
  });

  return { error: error?.message ?? null };
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: 'No network connection' };
  if (!isTauri()) return { error: 'Google Sign In requires the desktop app' };

  try {
    const redirectUri = `http://localhost:${OAUTH_PORT}`;
    const callbackPromise = waitForOAuthCallback(OAUTH_PORT);

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error: error.message };
    if (!data.url) return { error: 'No auth URL returned' };

    await openUrl(data.url);

    const callbackUrl = await callbackPromise;
    if (!callbackUrl) return { error: 'OAuth callback not received' };

    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    if (!code) return { error: 'No auth code in callback' };

    const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
    return { error: exchangeError?.message ?? null };
  } catch (err) {
    return { error: String(err) };
  }
}

export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: 'No network connection' };

  const { error } = await client.auth.verifyOtp({ email, token, type: 'email' });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function getSession() {
  const client = getSupabaseClient();
  if (!client) return null;
  const {
    data: { session },
  } = await client.auth.getSession();
  return session;
}

export async function getAuthUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
}

export function subscribeToAuthStateChange(listener: AuthStateListener): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(listener);
  return () => subscription.unsubscribe();
}
