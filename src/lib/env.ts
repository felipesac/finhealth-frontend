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

function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },
  get UPSTASH_REDIS_REST_URL() {
    return optionalEnv('UPSTASH_REDIS_REST_URL');
  },
  get UPSTASH_REDIS_REST_TOKEN() {
    return optionalEnv('UPSTASH_REDIS_REST_TOKEN');
  },
};
