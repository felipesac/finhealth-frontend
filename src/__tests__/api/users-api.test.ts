import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockChain, mockAdminChain } = vi.hoisted(() => {
  const mockChain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  };
  const mockAdminChain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  };
  return { mockChain, mockAdminChain };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => mockChain),
  }),
}));

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => mockAdminChain),
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'new-user-id' } },
          error: null,
        }),
        deleteUser: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 29, resetAt: Date.now() + 60000 }),
  getRateLimitKey: vi.fn().mockReturnValue('users:127.0.0.1'),
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

vi.mock('@/lib/email', () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

import { GET, POST } from '@/app/api/users/route';
import { rateLimit } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

function makeGetReq() {
  return new Request('http://localhost:3000/api/users', { method: 'GET' });
}

function makePostReq(body: unknown) {
  return new Request('http://localhost:3000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of ['select', 'insert', 'eq', 'in', 'order', 'single']) {
      mockChain[key].mockReturnValue(mockChain);
      mockAdminChain[key].mockReturnValue(mockAdminChain);
    }
    (mockAdminChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: [{ user_id: 'user-1' }],
      error: null,
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

  it('returns 200 with user list', async () => {
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe('POST /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of ['select', 'insert', 'eq', 'in', 'order', 'single']) {
      mockChain[key].mockReturnValue(mockChain);
      mockAdminChain[key].mockReturnValue(mockAdminChain);
    }
    (mockAdminChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: { id: 'profile-1', email: 'new@test.com', name: 'New User', role: 'auditor' },
      error: null,
    }));
  });

  it('returns 400 for invalid body', async () => {
    const res = await POST(makePostReq({ email: 'bad', role: 'invalid' }));
    expect(res.status).toBe(400);
  });

  it('returns 200 for valid user invite', async () => {
    const res = await POST(makePostReq({
      email: 'new@test.com',
      name: 'New User',
      role: 'auditor',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
