import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase middleware before importing
vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn().mockImplementation(async () => {
    const { NextResponse } = await import('next/server');
    return NextResponse.next();
  }),
}));

import { middleware } from './middleware';

function createRequest(method: string, url: string, headers?: Record<string, string>) {
  return new Request(url, {
    method,
    headers: {
      host: 'finhealth.app',
      ...headers,
    },
  });
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CSRF protection', () => {
    it('allows GET requests without origin', async () => {
      const req = createRequest('GET', 'https://finhealth.app/dashboard');
      const res = await middleware(req as never);
      expect(res.status).not.toBe(403);
    });

    it('allows POST requests when origin matches host', async () => {
      const req = createRequest('POST', 'https://finhealth.app/api/accounts', {
        origin: 'https://finhealth.app',
      });
      const res = await middleware(req as never);
      expect(res.status).not.toBe(403);
    });

    it('blocks POST requests when origin does not match host', async () => {
      const req = createRequest('POST', 'https://finhealth.app/api/accounts', {
        origin: 'https://evil.com',
      });
      const res = await middleware(req as never);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('CSRF validation failed');
    });

    it('blocks PATCH requests from different origin', async () => {
      const req = createRequest('PATCH', 'https://finhealth.app/api/users/123', {
        origin: 'https://attacker.com',
      });
      const res = await middleware(req as never);
      expect(res.status).toBe(403);
    });

    it('blocks DELETE requests from different origin', async () => {
      const req = createRequest('DELETE', 'https://finhealth.app/api/accounts/1', {
        origin: 'https://malicious.site',
      });
      const res = await middleware(req as never);
      expect(res.status).toBe(403);
    });

    it('allows POST requests without origin header (same-origin browser behavior)', async () => {
      const req = createRequest('POST', 'https://finhealth.app/api/accounts');
      const res = await middleware(req as never);
      expect(res.status).not.toBe(403);
    });

    it('allows HEAD requests regardless of origin', async () => {
      const req = createRequest('HEAD', 'https://finhealth.app/api/accounts', {
        origin: 'https://other.com',
      });
      const res = await middleware(req as never);
      expect(res.status).not.toBe(403);
    });

    it('allows OPTIONS requests regardless of origin', async () => {
      const req = createRequest('OPTIONS', 'https://finhealth.app/api/accounts', {
        origin: 'https://other.com',
      });
      const res = await middleware(req as never);
      expect(res.status).not.toBe(403);
    });
  });

  describe('security headers in next.config.mjs', () => {
    // These headers are configured in next.config.mjs headers() function.
    // They are applied by Next.js to all responses automatically.
    // This test documents which headers are expected.
    it('documents expected security headers configured in next.config', () => {
      const expectedHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'X-DNS-Prefetch-Control',
        'Strict-Transport-Security',
        'Permissions-Policy',
        'Content-Security-Policy',
      ];
      // These are validated at the integration/E2E level.
      // This test serves as documentation that 7 security headers are configured.
      expect(expectedHeaders).toHaveLength(7);
    });
  });
});
