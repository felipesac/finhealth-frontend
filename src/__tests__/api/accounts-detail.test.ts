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
  getRateLimitKey: vi.fn().mockReturnValue('accounts-detail:127.0.0.1'),
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

import { GET } from '@/app/api/accounts/[id]/route';
import { rateLimit } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

const testId = '550e8400-e29b-41d4-a716-446655440000';
const routeParams = { params: Promise.resolve({ id: testId }) };

function makeGetReq() {
  return new Request(`http://localhost:3000/api/accounts/${testId}`, { method: 'GET' });
}

describe('GET /api/accounts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of ['select', 'eq', 'single']) {
      mockChain[key].mockReturnValue(mockChain);
    }
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: { id: testId, account_number: 'ACC-001', status: 'pending', total_amount: 1000 },
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

  it('returns 200 with account data', async () => {
    const res = await GET(makeGetReq(), routeParams);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(testId);
  });

  it('returns 404 when account not found', async () => {
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: null,
      error: { message: 'not found' },
    }));
    const res = await GET(makeGetReq(), routeParams);
    expect(res.status).toBe(404);
  });
});
