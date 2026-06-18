// One job: all authentication actions.
// Email code and password sign-in both live here.
// Never import this from components - use useAuth hook instead.

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { remoteUnavailableMessage } from './env';
import { getSupabaseClient } from './supabase';

export type AuthStateListener = (
  event: AuthChangeEvent,
  session: Session | null,
) => void;

export async function signInWithOTPCode(
  email: string,
  shouldCreateUser = true,
): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: remoteUnavailableMessage };

  try {
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser,
        // No emailRedirectTo; code flow does not need a redirect URL.
      },
    });

    return { error: error?.message ?? null };
  } catch (err) {
    return { error: String(err) };
  }
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: remoteUnavailableMessage };

  try {
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error?.message ?? null };
  } catch (err) {
    return { error: String(err) };
  }
}

export async function updateAuthPassword(password: string): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: remoteUnavailableMessage };

  try {
    const { error } = await client.auth.updateUser({ password });
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: String(err) };
  }
}

export async function verifyOTPCode(
  email: string,
  token: string,
): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: remoteUnavailableMessage };

  try {
    const { error } = await client.auth.verifyOtp({ email, token, type: 'email' });
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: String(err) };
  }
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
