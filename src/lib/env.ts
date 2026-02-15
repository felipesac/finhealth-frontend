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
  // Core (required)
  get NEXT_PUBLIC_SUPABASE_URL() { return requireEnv('NEXT_PUBLIC_SUPABASE_URL'); },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() { return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'); },

  // App
  get NEXT_PUBLIC_APP_URL() { return optionalEnv('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'; },

  // N8N Integration
  get N8N_TISS_WEBHOOK_URL() { return optionalEnv('N8N_TISS_WEBHOOK_URL'); },
  get N8N_BILLING_WEBHOOK_URL() { return optionalEnv('N8N_BILLING_WEBHOOK_URL'); },
  get N8N_GLOSA_WEBHOOK_URL() { return optionalEnv('N8N_GLOSA_WEBHOOK_URL'); },

  // Email (Resend)
  get RESEND_API_KEY() { return optionalEnv('RESEND_API_KEY'); },
  get RESEND_FROM_EMAIL() { return optionalEnv('RESEND_FROM_EMAIL'); },

  // Push Notifications (Web Push VAPID)
  get NEXT_PUBLIC_VAPID_PUBLIC_KEY() { return optionalEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY'); },
  get VAPID_PUBLIC_KEY() { return optionalEnv('VAPID_PUBLIC_KEY'); },
  get VAPID_PRIVATE_KEY() { return optionalEnv('VAPID_PRIVATE_KEY'); },
  get VAPID_SUBJECT() { return optionalEnv('VAPID_SUBJECT'); },

  // Upstash Redis (rate limiting — optional, falls back to in-memory)
  get UPSTASH_REDIS_REST_URL() { return optionalEnv('UPSTASH_REDIS_REST_URL'); },
  get UPSTASH_REDIS_REST_TOKEN() { return optionalEnv('UPSTASH_REDIS_REST_TOKEN'); },

  // Sentry
  get NEXT_PUBLIC_SENTRY_DSN() { return optionalEnv('NEXT_PUBLIC_SENTRY_DSN'); },
  get SENTRY_ORG() { return optionalEnv('SENTRY_ORG'); },
  get SENTRY_PROJECT() { return optionalEnv('SENTRY_PROJECT'); },

  // Logging
  get LOG_LEVEL() { return optionalEnv('LOG_LEVEL') || 'info'; },
};

/**
 * Validate environment at boot. Logs warnings for missing optional vars.
 * Call this in the app's instrumentation or layout to surface misconfigurations early.
 */
export function validateEnvAtBoot(): void {
  const warnings: string[] = [];

  const optionalGroups: Record<string, string[]> = {
    'N8N Integration': ['N8N_TISS_WEBHOOK_URL', 'N8N_BILLING_WEBHOOK_URL', 'N8N_GLOSA_WEBHOOK_URL'],
    'Email': ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
    'Push Notifications': ['NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'],
    'Sentry': ['NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_ORG', 'SENTRY_PROJECT'],
  };

  for (const [group, vars] of Object.entries(optionalGroups)) {
    const missing = vars.filter((v) => !process.env[v]);
    if (missing.length > 0 && missing.length < vars.length) {
      warnings.push(`${group}: partial config — missing ${missing.join(', ')}`);
    }
  }

  for (const msg of warnings) {
    // Use console.warn here intentionally — logger.ts may import env.ts, causing circular dependency
    console.warn(JSON.stringify({ level: 'warn', message: `[env] ${msg}`, timestamp: new Date().toISOString() }));
  }
}
