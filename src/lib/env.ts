/**
 * Validated environment variables.
 * Throws at import time if required vars are missing.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      'Check your .env.local file against .env.example.'
    );
  }
  return value;
}

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },
};
