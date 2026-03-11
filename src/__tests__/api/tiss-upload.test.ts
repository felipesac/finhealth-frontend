import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUser } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  return { mockGetUser };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 9, resetAt: Date.now() + 60000 }),
  getRateLimitKey: vi.fn().mockReturnValue('tiss-upload:127.0.0.1'),
}));

vi.mock('@/lib/audit-logger', () => ({
  auditLog: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/sanitize-xml', () => ({
  sanitizeXml: vi.fn((xml: string) => xml),
}));

vi.mock('@/lib/rbac', () => ({
  checkPermission: vi.fn().mockResolvedValue({
    authorized: true, userId: 'user-1', email: 'test@test.com', role: 'admin', organizationId: 'org-1',
  }),
}));

import { POST } from '@/app/api/tiss/upload/route';
import { rateLimit } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

const VALID_XML = '<ans:mensagemTISS><ans:cabecalho/></ans:mensagemTISS>';

function makeReq(body: unknown) {
  return new Request('http://localhost:3000/api/tiss/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/tiss/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    });
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(checkPermission).mockResolvedValueOnce({ authorized: false, status: 401, error: 'Nao autorizado' });
    const res = await POST(makeReq({ xml: VALID_XML }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user lacks tiss:write permission', async () => {
    vi.mocked(checkPermission).mockResolvedValueOnce({ authorized: false, status: 403, error: 'Permissao insuficiente' });
    const res = await POST(makeReq({ xml: VALID_XML }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Permissao insuficiente');
  });

  it('returns 400 when xml is missing', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetAt: Date.now() + 60000 });
    const res = await POST(makeReq({ xml: VALID_XML }));
    expect(res.status).toBe(429);
  });

  it('processes valid TISS XML and returns validation result', async () => {
    const res = await POST(makeReq({ xml: VALID_XML }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
