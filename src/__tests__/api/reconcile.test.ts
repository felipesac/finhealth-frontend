import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUser, mockChain, mockSingle } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockSingle = vi.fn();
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
    then: vi.fn().mockResolvedValue({ error: null }),
  };
  return { mockGetUser, mockChain, mockSingle };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => mockChain),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 19, resetAt: Date.now() + 60000 }),
  getRateLimitKey: vi.fn().mockReturnValue('reconcile:127.0.0.1'),
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

import { POST } from '@/app/api/reconcile/route';
import { rateLimit } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

function makeReq(body: unknown) {
  return new Request('http://localhost:3000/api/reconcile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  paymentId: '550e8400-e29b-41d4-a716-446655440000',
  accountId: '660e8400-e29b-41d4-a716-446655440000',
};

describe('POST /api/reconcile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    });
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(checkPermission).mockResolvedValueOnce({ authorized: false, status: 401, error: 'Nao autorizado' });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    const res = await POST(makeReq({ paymentId: 'bad', accountId: 'bad' }));
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetAt: Date.now() + 60000 });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(429);
  });

  it('returns 404 if payment not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Pagamento nao encontrado');
  });

  it('returns 409 if payment already matched', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        total_amount: 1000, matched_amount: 1000,
        unmatched_amount: 0, reconciliation_status: 'matched',
      },
      error: null,
    });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('conciliado');
  });
});
