type Severity = 'fatal' | 'error' | 'warning' | 'info';

interface ErrorContext {
  userId?: string;
  route?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

/**
 * Capture an exception for error tracking.
 * Replace the implementation with Sentry when ready:
 *   import * as Sentry from '@sentry/nextjs';
 *   Sentry.captureException(error, { extra: context });
 */
export function captureException(error: unknown, context?: ErrorContext): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error('[error-tracking]', {
    message,
    stack,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Capture a message for error tracking.
 */
export function captureMessage(message: string, severity: Severity = 'info', context?: ErrorContext): void {
  const logFn = severity === 'fatal' || severity === 'error' ? console.error : console.warn;

  logFn(`[error-tracking] [${severity}]`, {
    message,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Set user context for error tracking.
 */
export function setUser(user: { id: string; email?: string } | null): void {
  // Replace with Sentry.setUser(user) when ready
  if (user) {
    console.debug('[error-tracking] User set:', user.id);
  }
}

// =============================================================================
// Sentry PII Scrubbing Configuration (LGPD Compliance)
// =============================================================================
// Activate these hooks when initializing Sentry to prevent PII leaks.
// Usage in sentry.client.config.ts / sentry.server.config.ts:
//   import { SENTRY_PII_CONFIG } from '@/lib/error-tracking';
//   Sentry.init({ dsn: '...', ...SENTRY_PII_CONFIG });
// =============================================================================

const CPF_PATTERN = /\d{3}\.\d{3}\.\d{3}-\d{2}/g;
const CPF_UNFORMATTED_PATTERN = /\b\d{11}\b/g;

function scrubPiiFromString(text: string): string {
  return text
    .replace(CPF_PATTERN, '***.***.***-**')
    .replace(CPF_UNFORMATTED_PATTERN, '***********');
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const SENTRY_PII_CONFIG = {
  beforeSend(event: any) {
    // Strip user email from event context
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
      delete event.user.ip_address;
    }

    // Scrub CPF patterns from request body
    if (event.request?.data && typeof event.request.data === 'string') {
      event.request.data = scrubPiiFromString(event.request.data);
    }

    // Scrub CPF from exception messages
    if (event.exception?.values) {
      for (const ex of event.exception.values) {
        if (ex.value && typeof ex.value === 'string') {
          ex.value = scrubPiiFromString(ex.value);
        }
      }
    }

    return event;
  },

  beforeBreadcrumb(breadcrumb: any) {
    if (breadcrumb.data) {
      const sensitiveKeys = ['cpf', 'email', 'phone', 'birth_date', 'name'];
      for (const key of sensitiveKeys) {
        if (key in breadcrumb.data) {
          breadcrumb.data[key] = '[REDACTED]';
        }
      }
    }
    if (breadcrumb.message && typeof breadcrumb.message === 'string') {
      breadcrumb.message = scrubPiiFromString(breadcrumb.message);
    }
    return breadcrumb;
  },
} as const;
/* eslint-enable @typescript-eslint/no-explicit-any */
