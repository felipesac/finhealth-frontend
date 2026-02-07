import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must run before module import - route reads env at module scope
const { mockGetUser } = vi.hoisted(() => {
  process.env.N8N_TISS_WEBHOOK_URL = 'https://n8n.test.local/webhook/tiss-upload';
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

import { POST } from '@/app/api/tiss/upload/route';
import { rateLimit } from '@/lib/rate-limit';

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
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await POST(makeReq({ xml: VALID_XML }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user lacks tiss:write permission', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'auditor@test.com', user_metadata: { role: 'auditor' } } },
    });
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
    vi.mocked(rateLimit).mockReturnValueOnce({ success: false, remaining: 0, resetAt: Date.now() + 60000 });
    const res = await POST(makeReq({ xml: VALID_XML }));
    expect(res.status).toBe(429);
  });

  it('handles n8n error response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('Internal error', { status: 502 })
    );
    const res = await POST(makeReq({ xml: VALID_XML }));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('handles n8n 200 with JSON body', async () => {
    const n8nResult = { success: true, isValid: true, errors: [], guideNumber: 'G-001' };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(n8nResult), { status: 200 })
    );
    const res = await POST(makeReq({ xml: VALID_XML }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.guideNumber).toBe('G-001');
  });

  it('handles n8n 200 with empty body gracefully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('', { status: 200 })
    );
    const res = await POST(makeReq({ xml: VALID_XML }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toBe('Upload processado pelo n8n');
  });
});
