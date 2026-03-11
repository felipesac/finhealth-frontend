import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockChain } = vi.hoisted(() => {
  const mockChain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
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
  getRateLimitKey: vi.fn().mockReturnValue('payments-detail:127.0.0.1'),
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

import { GET } from '@/app/api/payments/[id]/route';
import { rateLimit } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

const testId = '550e8400-e29b-41d4-a716-446655440000';
const routeParams = { params: Promise.resolve({ id: testId }) };

function makeGetReq() {
  return new Request(`http://localhost:3000/api/payments/${testId}`, { method: 'GET' });
}

describe('GET /api/payments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of ['select', 'eq', 'single']) {
      mockChain[key].mockReturnValue(mockChain);
    }
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: { id: testId, amount: 1500, status: 'received', payment_date: '2026-01-15' },
      error: null,
    }));
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(checkPermission).mockResolvedValueOnce({ authorized: false, status: 401, error: 'Nao autorizado' });
    const res = await GET(makeGetReq(), routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetAt: Date.now() + 60000 });
    const res = await GET(makeGetReq(), routeParams);
    expect(res.status).toBe(429);
  });

  it('returns 200 with payment data', async () => {
    const res = await GET(makeGetReq(), routeParams);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(testId);
  });

  it('returns 404 when payment not found', async () => {
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: null,
      error: { message: 'not found' },
    }));
    const res = await GET(makeGetReq(), routeParams);
    expect(res.status).toBe(404);
  });
});
