// One job: export the Supabase client singleton.
// This is the only file that imports from @supabase/supabase-js.
// All remote calls in the app go through this file.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV, hasRemote } from './env';

export type AppSupabaseClient = SupabaseClient | null;

let _client: AppSupabaseClient = null;

export function getSupabaseClient(): AppSupabaseClient {
  if (!hasRemote) return null;
  if (!_client) {
    _client = createClient(ENV.supabaseUrl, ENV.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}

export async function remoteCall<T>(
  fn: (client: SupabaseClient) => Promise<{ data: T | null; error: unknown }>,
): Promise<{ data: T | null; error: unknown }> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: null };
  try {
    const result = await fn(client);
    if (result.error) {
      console.warn('Remote call returned error; app continues offline:', result.error);
    }
    return result;
  } catch (err) {
    console.warn('Remote call failed; app continues offline:', err);
    return { data: null, error: err };
  }
}

export async function invokeRemoteFunction<T>(
  name: string,
  body?: Record<string, unknown>,
): Promise<{ data: T | null; error: unknown }> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: 'No network connection' };
  try {
    const { data, error } = await client.functions.invoke<T>(name, { body });
    if (error) {
      console.warn(`Remote function '${name}' returned error:`, error);
    }
    return { data: data ?? null, error };
  } catch (err) {
    console.warn(`Remote function '${name}' failed:`, err);
    return { data: null, error: err };
  }
}
