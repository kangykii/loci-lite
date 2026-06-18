// Warn at import if Supabase vars are missing — remote features stay disabled.
// Use the Publishable key (sb_publishable_…), not the legacy anon JWT key.

function readEnvVar(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed.startsWith('your_supabase_') || trimmed.endsWith('...')) {
    return '';
  }
  return trimmed;
}

export const ENV = {
  supabaseUrl: readEnvVar(import.meta.env.VITE_SUPABASE_URL),
  supabasePublishableKey: readEnvVar(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  stripePublishableKey: readEnvVar(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY),
  modernWriterPriceId: readEnvVar(import.meta.env.VITE_STRIPE_MODERN_WRITER_PRICE_ID),
} as const;

if (!ENV.supabaseUrl || !ENV.supabasePublishableKey) {
  console.warn('Supabase environment variables missing — remote features disabled');
}

export const hasRemote = Boolean(ENV.supabaseUrl && ENV.supabasePublishableKey);
export const remoteUnavailableMessage = 'Account login is not configured in this build.';
