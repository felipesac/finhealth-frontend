import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

type Severity = 'fatal' | 'error' | 'warning' | 'info';

interface ErrorContext {
  userId?: string;
  route?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

// =============================================================================
// Public API
// =============================================================================

export function captureException(error: unknown, context?: ErrorContext): void {
  const message = error instanceof Error ? error.message : String(error);
  logger.error('[error-tracking] ' + message, error, context);
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, severity: Severity = 'info', context?: ErrorContext): void {
  if (severity === 'fatal' || severity === 'error') {
    logger.error(`[error-tracking] [${severity}] ${message}`, undefined, context);
  } else {
    logger.warn(`[error-tracking] [${severity}] ${message}`, context);
  }
  Sentry.captureMessage(message, { level: severity });
}

export function setUser(user: { id: string; email?: string } | null): void {
  if (user) {
    logger.debug('[error-tracking] User set', { userId: user.id });
  }
  Sentry.setUser(user);
}

// =============================================================================
// Sentry PII Scrubbing Configuration (LGPD Compliance)
// =============================================================================
// These hooks are spread into Sentry.init() in sentry.*.config.ts files.
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
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
      delete event.user.ip_address;
    }

    if (event.request?.data && typeof event.request.data === 'string') {
      event.request.data = scrubPiiFromString(event.request.data);
    }

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
