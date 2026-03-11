import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockChain } = vi.hoisted(() => {
  const mockChain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
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
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 29, resetAt: Date.now() + 60000 }),
  getRateLimitKey: vi.fn().mockReturnValue('procedures:127.0.0.1'),
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

import { GET, POST } from '@/app/api/procedures/route';
import { rateLimit } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

function makeGetReq(params?: string) {
  return new Request(`http://localhost:3000/api/procedures${params ? `?${params}` : ''}`, { method: 'GET' });
}

function makePostReq(body: unknown) {
  return new Request('http://localhost:3000/api/procedures', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/procedures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of ['select', 'insert', 'eq', 'order', 'range', 'single']) {
      mockChain[key].mockReturnValue(mockChain);
    }
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: [{ id: 'proc-1', description: 'Test Procedure' }],
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

  it('returns 200 with procedures list', async () => {
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toBeDefined();
  });
});

describe('POST /api/procedures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of ['select', 'insert', 'eq', 'order', 'range', 'single']) {
      mockChain[key].mockReturnValue(mockChain);
    }
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: { id: 'proc-1', description: 'New Procedure' },
      error: null,
    }));
  });

  it('returns 400 for invalid body', async () => {
    const res = await POST(makePostReq({ description: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 201 for valid procedure creation', async () => {
    const res = await POST(makePostReq({
      medical_account_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Consulta medica',
      quantity: 1,
      unit_price: 150,
      total_price: 150,
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
