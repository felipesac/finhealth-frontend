import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUser, mockChain } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    then: vi.fn().mockResolvedValue({ error: null }),
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
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 29, resetAt: Date.now() + 60000 }),
  getRateLimitKey: vi.fn().mockReturnValue('appeals:127.0.0.1'),
}));

vi.mock('@/lib/audit-logger', () => ({
  auditLog: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

import { PATCH } from '@/app/api/appeals/route';
import { rateLimit } from '@/lib/rate-limit';

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
    mockChain.eq.mockResolvedValue({ data: null, error: null });
  });

  it('returns 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
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
    vi.mocked(rateLimit).mockReturnValueOnce({ success: false, remaining: 0, resetAt: Date.now() + 60000 });
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
