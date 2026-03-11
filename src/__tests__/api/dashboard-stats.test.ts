import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockChain } = vi.hoisted(() => {
  const mockChain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };
  return { mockChain };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => mockChain),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 29, resetAt: Date.now() + 60000 }),
  getRateLimitKey: vi.fn().mockReturnValue('dashboard-stats:127.0.0.1'),
}));

vi.mock('@/lib/rbac', () => ({
  checkPermission: vi.fn().mockResolvedValue({
    authorized: true, userId: 'user-1', email: 'test@test.com', role: 'admin', organizationId: 'org-1',
  }),
}));

import { GET } from '@/app/api/dashboard/stats/route';
import { rateLimit } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

function makeReq() {
  return new Request('http://localhost:3000/api/dashboard/stats', { method: 'GET' });
}

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of ['select', 'eq', 'order', 'limit']) {
      mockChain[key].mockReturnValue(mockChain);
    }
    // Make chain thenable — resolve with empty data
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: [],
      error: null,
    }));
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(checkPermission).mockResolvedValueOnce({ authorized: false, status: 401, error: 'Nao autorizado' });
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetAt: Date.now() + 60000 });
    const res = await GET(makeReq());
    expect(res.status).toBe(429);
  });

  it('returns 200 with aggregated metrics', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('metrics');
    expect(body.data.metrics).toHaveProperty('totalBilling');
    expect(body.data.metrics).toHaveProperty('totalGlosas');
    expect(body.data.metrics).toHaveProperty('totalPayments');
    expect(body.data).toHaveProperty('paymentChartData');
    expect(body.data).toHaveProperty('accountStatusData');
    expect(body.data).toHaveProperty('glosasTrendData');
  });
});
