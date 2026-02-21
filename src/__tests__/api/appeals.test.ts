import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUser, mockChain } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockChain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
  };
  // Make chain thenable so `await supabase.from(...).update(...).eq(...).eq(...)` resolves
  mockChain.then = vi.fn((resolve: (v: unknown) => void) => resolve({ data: null, error: null }));
  return { mockGetUser, mockChain };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => mockChain),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 29, resetAt: Date.now() + 60000 }),
  getRateLimitKey: vi.fn().mockReturnValue('appeals:127.0.0.1'),
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

import { PATCH } from '@/app/api/appeals/route';
import { rateLimit } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

function makeReq(body: unknown) {
  return new Request('http://localhost:3000/api/appeals', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/appeals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    });
    // Re-establish chain returns after clearAllMocks
    mockChain.update.mockReturnValue(mockChain);
    mockChain.eq.mockReturnValue(mockChain);
    mockChain.insert.mockReturnValue(mockChain);
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({ data: null, error: null }));
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(checkPermission).mockResolvedValueOnce({ authorized: false, status: 401, error: 'Nao autorizado' });
    const res = await PATCH(makeReq({
      glosaId: '550e8400-e29b-41d4-a716-446655440000',
      text: 'Recurso', action: 'submit',
    }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    const res = await PATCH(makeReq({ glosaId: 'bad', text: '', action: 'submit' }));
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetAt: Date.now() + 60000 });
    const res = await PATCH(makeReq({
      glosaId: '550e8400-e29b-41d4-a716-446655440000',
      text: 'Test', action: 'submit',
    }));
    expect(res.status).toBe(429);
  });

  it('returns 200 for valid submit', async () => {
    const res = await PATCH(makeReq({
      glosaId: '550e8400-e29b-41d4-a716-446655440000',
      text: 'Recurso fundamentado', action: 'submit',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 200 for valid save_draft', async () => {
    const res = await PATCH(makeReq({
      glosaId: '550e8400-e29b-41d4-a716-446655440000',
      text: 'Rascunho', action: 'save_draft',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
