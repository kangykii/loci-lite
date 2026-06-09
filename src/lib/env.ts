// Warn at import if Supabase vars are missing — remote features stay disabled.

function readEnvVar(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed.startsWith('your_supabase_')) {
    return '';
  }
  return trimmed;
}

export const ENV = {
  supabaseUrl: readEnvVar(import.meta.env.VITE_SUPABASE_URL),
  supabaseKey: readEnvVar(import.meta.env.VITE_SUPABASE_ANON_KEY),
} as const;

if (!ENV.supabaseUrl || !ENV.supabaseKey) {
  console.warn('Supabase environment variables missing — remote features disabled');
}

export const hasRemote = Boolean(ENV.supabaseUrl && ENV.supabaseKey);
