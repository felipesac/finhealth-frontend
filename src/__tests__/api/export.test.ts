import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUser, mockChain } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockChain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
  };
  return { mockGetUser, mockChain };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => mockChain),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 4, resetAt: Date.now() + 60000 }),
  getRateLimitKey: vi.fn().mockReturnValue('export:127.0.0.1'),
}));

vi.mock('@/lib/audit-logger', () => ({
  auditLog: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/rbac', () => ({
  checkPermission: vi.fn().mockResolvedValue({
    authorized: true, userId: 'user-1', email: 'test@test.com', role: 'admin', organizationId: 'org-1',
  }),
}));

import { POST } from '@/app/api/export/route';
import { rateLimit } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

function makeReq(body: unknown) {
  return new Request('http://localhost:3000/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    });
    // Re-establish chain returns after clearAllMocks
    for (const key of ['select', 'insert', 'eq', 'order', 'limit', 'gte', 'lte']) {
      mockChain[key].mockReturnValue(mockChain);
    }
    // Make chain thenable — resolves with test data when awaited
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: [{ account_number: 'CT-001', status: 'paid', total_amount: 5000 }],
      error: null,
    }));
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(checkPermission).mockResolvedValueOnce({ authorized: false, status: 401, error: 'Nao autorizado' });
    const res = await POST(makeReq({ types: ['accounts'] }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for empty types', async () => {
    const res = await POST(makeReq({ types: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid date range', async () => {
    const res = await POST(makeReq({
      types: ['accounts'], dateFrom: '2024-12-31', dateTo: '2024-01-01',
    }));
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetAt: Date.now() + 60000 });
    const res = await POST(makeReq({ types: ['accounts'] }));
    expect(res.status).toBe(429);
  });

  it('returns CSV for valid export', async () => {
    const res = await POST(makeReq({ types: ['accounts'] }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
  });
});
