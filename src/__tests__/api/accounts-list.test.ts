import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockChain } = vi.hoisted(() => {
  const mockChain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
  };
  return { mockChain };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => mockChain),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 19, resetAt: Date.now() + 60000 }),
  getRateLimitKey: vi.fn().mockReturnValue('accounts-list:127.0.0.1'),
}));

vi.mock('@/lib/audit-logger', () => ({
  auditLog: vi.fn(),
  auditRead: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/rbac', () => ({
  checkPermission: vi.fn().mockResolvedValue({
    authorized: true, userId: 'user-1', email: 'test@test.com', role: 'admin', organizationId: 'org-1',
  }),
}));

import { GET } from '@/app/api/accounts/route';
import { rateLimit } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

function makeGetReq(queryString = '') {
  return new Request(`http://localhost:3000/api/accounts${queryString}`, { method: 'GET' });
}

describe('GET /api/accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of ['select', 'eq', 'order', 'range', 'or']) {
      mockChain[key].mockReturnValue(mockChain);
    }
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: [
        { id: '1', account_number: 'ACC-001', status: 'pending', total_amount: 1000 },
      ],
      error: null,
      count: 1,
    }));
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(checkPermission).mockResolvedValueOnce({ authorized: false, status: 401, error: 'Nao autorizado' });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetAt: Date.now() + 60000 });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(429);
  });

  it('returns 200 with paginated data', async () => {
    const res = await GET(makeGetReq('?page=1&limit=50'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.total).toBe(1);
  });
});
