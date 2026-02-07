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
