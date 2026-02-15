import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted ensures these are available when vi.mock is hoisted
// ---------------------------------------------------------------------------

const { mockSentry } = vi.hoisted(() => ({
  mockSentry: {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    setUser: vi.fn(),
  },
}));

vi.mock('@sentry/nextjs', () => mockSentry);

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are declared)
// ---------------------------------------------------------------------------

import {
  captureException,
  captureMessage,
  setUser,
  SENTRY_PII_CONFIG,
} from '@/lib/error-tracking';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('error-tracking', () => {
  // 1. captureException logs error via logger.error
  it('captureException logs error via logger.error', () => {
    const error = new Error('something broke');
    const context = { userId: 'u1', route: '/dashboard' };

    captureException(error, context);

    expect(logger.error).toHaveBeenCalledWith(
      '[error-tracking] something broke',
      error,
      context,
    );
  });

  // 2. captureException calls Sentry.captureException when SDK available
  it('captureException calls Sentry.captureException when SDK available', () => {
    const error = new Error('boom');
    const context = { action: 'save' };

    captureException(error, context);

    expect(mockSentry.captureException).toHaveBeenCalledWith(error, {
      extra: context,
    });
  });

  // 3. captureMessage with 'error' severity calls logger.error
  it("captureMessage with 'error' severity calls logger.error", () => {
    captureMessage('disk full', 'error', { route: '/upload' });

    expect(logger.error).toHaveBeenCalledWith(
      '[error-tracking] [error] disk full',
      undefined,
      { route: '/upload' },
    );
  });

  // 4. captureMessage with 'warning' severity calls logger.warn
  it("captureMessage with 'warning' severity calls logger.warn", () => {
    captureMessage('slow query', 'warning', { extra: { ms: 3000 } });

    expect(logger.warn).toHaveBeenCalledWith(
      '[error-tracking] [warning] slow query',
      { extra: { ms: 3000 } },
    );
  });

  // 5. captureMessage calls Sentry.captureMessage when SDK available
  it('captureMessage calls Sentry.captureMessage when SDK available', () => {
    captureMessage('deployment done', 'info');

    expect(mockSentry.captureMessage).toHaveBeenCalledWith('deployment done', {
      level: 'info',
    });
  });

  // 6. setUser calls Sentry.setUser when SDK available
  it('setUser calls Sentry.setUser when SDK available', () => {
    const user = { id: 'user-42', email: 'u@example.com' };

    setUser(user);

    expect(logger.debug).toHaveBeenCalledWith('[error-tracking] User set', {
      userId: 'user-42',
    });
    expect(mockSentry.setUser).toHaveBeenCalledWith(user);
  });

  // 7. SENTRY_PII_CONFIG.beforeSend scrubs CPF patterns and strips user PII
  it('beforeSend scrubs CPF patterns from exception values and strips user email/ip', () => {
    const event = {
      user: {
        id: 'u1',
        email: 'jane@example.com',
        username: 'jane',
        ip_address: '10.0.0.1',
      },
      exception: {
        values: [
          { value: 'Validation failed for CPF 123.456.789-00' },
          { value: 'Raw CPF 12345678900 detected' },
        ],
      },
      request: {
        data: 'cpf=123.456.789-00&name=Jane',
      },
    };

    const result = SENTRY_PII_CONFIG.beforeSend(event);

    // User PII stripped
    expect(result.user.email).toBeUndefined();
    expect(result.user.username).toBeUndefined();
    expect(result.user.ip_address).toBeUndefined();
    expect(result.user.id).toBe('u1'); // id preserved

    // CPF scrubbed from exception values
    expect(result.exception.values[0].value).toBe(
      'Validation failed for CPF ***.***.***-**',
    );
    expect(result.exception.values[1].value).toBe(
      'Raw CPF *********** detected',
    );

    // CPF scrubbed from request data
    expect(result.request.data).toBe('cpf=***.***.***-**&name=Jane');
  });

  // 8. SENTRY_PII_CONFIG.beforeBreadcrumb redacts sensitive keys
  it('beforeBreadcrumb redacts sensitive keys (cpf, email, phone, birth_date, name)', () => {
    const breadcrumb = {
      message: 'User CPF 123.456.789-00 submitted',
      data: {
        cpf: '123.456.789-00',
        email: 'jane@example.com',
        phone: '+5511999999999',
        birth_date: '1990-01-01',
        name: 'Jane Doe',
        account_id: 'acc-1', // non-sensitive, should remain
      },
    };

    const result = SENTRY_PII_CONFIG.beforeBreadcrumb(breadcrumb);

    // Sensitive keys redacted
    expect(result.data.cpf).toBe('[REDACTED]');
    expect(result.data.email).toBe('[REDACTED]');
    expect(result.data.phone).toBe('[REDACTED]');
    expect(result.data.birth_date).toBe('[REDACTED]');
    expect(result.data.name).toBe('[REDACTED]');

    // Non-sensitive key preserved
    expect(result.data.account_id).toBe('acc-1');

    // CPF scrubbed from message
    expect(result.message).toBe('User CPF ***.***.***-** submitted');
  });
});
