// One job: read and write user data to Supabase.
// All calls use remoteCall(); never raw Supabase client calls.
// Returns null gracefully when offline.

import { getAuthUser } from '../lib/auth';
import { remoteCall } from '../lib/supabase';

export interface RemoteProfile {
  id: string;
  displayName: string;
  tier: 'standard' | 'modern_writer';
  createdAt: string;
}

export interface Cosmetic {
  slug: string;
  unlockedAt: string;
}

type ProfileRow = {
  id: string;
  display_name: string;
  tier: 'standard' | 'modern_writer';
  created_at: string;
};

type CosmeticSlugRow = {
  slug: string;
};

type PluginSlugRow = {
  plugin_slug: string;
};

type TierRow = {
  tier: 'standard' | 'modern_writer';
};

type SubscriptionStatusRow = {
  status: string;
  current_period_end: string | null;
};

function toRemoteProfile(data: ProfileRow): RemoteProfile {
  return {
    id: data.id,
    displayName: data.display_name,
    tier: data.tier,
    createdAt: data.created_at,
  };
}

export async function ensureRemoteProfile(): Promise<RemoteProfile | null> {
  const user = await getAuthUser();
  if (!user) return null;
  const existing = await getRemoteProfile();
  if (existing) return existing;

  const { data } = await remoteCall<ProfileRow>(async (client) =>
    client
      .from('profiles')
      .upsert({ id: user.id, display_name: '' }, { onConflict: 'id' })
      .select('id, display_name, tier, created_at')
      .single(),
  );
  return data ? toRemoteProfile(data) : null;
}

export async function getRemoteProfile(): Promise<RemoteProfile | null> {
  const user = await getAuthUser();
  if (!user) return null;
  const { data } = await remoteCall<ProfileRow>(async (client) =>
    client
      .from('profiles')
      .select('id, display_name, tier, created_at')
      .eq('id', user.id)
      .maybeSingle(),
  );
  if (!data) return null;
  return toRemoteProfile(data);
}

export async function updateRemoteDisplayName(displayName: string): Promise<boolean> {
  const user = await getAuthUser();
  if (!user) return false;
  const { error } = await remoteCall(async (client) =>
    client.from('profiles').update({ display_name: displayName }).eq('id', user.id),
  );
  return !error;
}

export async function getUnlockedCosmetics(): Promise<string[]> {
  const user = await getAuthUser();
  if (!user) return [];
  const { data } = await remoteCall<CosmeticSlugRow[]>(async (client) =>
    client.from('cosmetics').select('slug').eq('user_id', user.id),
  );
  if (!data) return [];
  return data.map((row) => row.slug);
}

export async function getPluginEntitlements(): Promise<string[]> {
  const user = await getAuthUser();
  if (!user) return [];
  const now = new Date().toISOString();
  const { data } = await remoteCall<PluginSlugRow[]>(async (client) =>
    client
      .from('plugin_entitlements')
      .select('plugin_slug')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .or(`expires_at.is.null,expires_at.gt.${now}`),
  );
  if (!data) return [];
  return data.map((row) => row.plugin_slug);
}

export async function getUserTier(): Promise<'standard' | 'modern_writer'> {
  const user = await getAuthUser();
  if (!user) return 'standard';
  const { data } = await remoteCall<TierRow>(async (client) =>
    client.from('profiles').select('tier').eq('id', user.id).single(),
  );
  return data?.tier ?? 'standard';
}

export async function getSubscriptionStatus(): Promise<{
  status: string;
  currentPeriodEnd: string | null;
} | null> {
  const user = await getAuthUser();
  if (!user) return null;
  const { data } = await remoteCall<SubscriptionStatusRow>(async (client) =>
    client
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle(),
  );
  if (!data) return null;
  return {
    status: data.status,
    currentPeriodEnd: data.current_period_end ?? null,
  };
}
