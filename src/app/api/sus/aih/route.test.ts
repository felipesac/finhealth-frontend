import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rbac', () => ({ checkPermission: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(), getRateLimitKey: vi.fn().mockReturnValue('k') }));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn(), getClientIp: vi.fn().mockReturnValue('127.0.0.1') }));

import { GET, POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit } from '@/lib/rate-limit';

const validAih = {
  numero_aih: '1234567890123',
  procedimento_principal: '0301010072',
  data_internacao: '2024-01-15',
  valor: 5000,
  tipo_aih: '1',
  cnes: '1234567',
};

function makePost(body: unknown) {
  return new Request('http://localhost/api/sus/aih', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGet(params = '') {
  return new Request(`http://localhost/api/sus/aih${params}`);
}

function mockChain(result: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const c: Record<string, unknown> = {};
  ['from', 'select', 'insert', 'update', 'delete', 'eq', 'order', 'limit'].forEach(m => {
    (c as Record<string, unknown>)[m] = vi.fn().mockReturnValue(c);
  });
  c.single = vi.fn().mockResolvedValue(result);
  c.maybeSingle = vi.fn().mockResolvedValue(result);
  c.then = (r: (v: unknown) => void) => r(result);
  return c;
}

function mockSupa(...results: Array<{ data?: unknown; error?: unknown }>) {
  const sb = { from: vi.fn() };
  results.forEach(r => sb.from.mockReturnValueOnce(mockChain(r)));
  return sb;
}

function allowRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, remaining: 29, resetAt: 0 }); }
function denyRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: false, remaining: 0, resetAt: 0 }); }
function allowAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: true, userId: 'u1', email: 'a@b.com', role: 'finance_manager' }); }
function denyAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: false, status: 401, error: 'Denied' }); }

describe('GET /api/sus/aih', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 429 when rate limited', async () => {
    denyRate();
    const res = await GET(makeGet());
    expect(res.status).toBe(429);
  });

  it('returns 401 when not authenticated', async () => {
    allowRate(); denyAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await GET(makeGet());
    expect(res.status).toBe(401);
  });

  it('returns AIH list', async () => {
    allowRate(); allowAuth();
    const aihs = [{ id: 'a1', numero_aih: '123', status: 'rascunho' }];
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: aihs, error: null }),
    );
    const res = await GET(makeGet());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
  });
});

describe('POST /api/sus/aih', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 400 for invalid body', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await POST(makePost({}));
    expect(res.status).toBe(400);
  });

  it('returns 409 for duplicate AIH number', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: { id: 'existing' }, error: null }),
    );
    const res = await POST(makePost(validAih));
    expect(res.status).toBe(409);
  });

  it('creates AIH successfully', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa(
        { data: null, error: null },             // duplicate check
        { data: { id: 'new-1', ...validAih }, error: null }, // insert
      ),
    );

    const res = await POST(makePost(validAih));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('new-1');
  });

  it('calculates diarias from dates', async () => {
    allowRate(); allowAuth();
    const insertChain = mockChain({ data: { id: 'new-2', diarias: 5 }, error: null });
    const supabase = { from: vi.fn() };
    supabase.from
      .mockReturnValueOnce(mockChain({ data: null, error: null }))
      .mockReturnValueOnce(insertChain);
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);

    const body = { ...validAih, data_saida: '2024-01-20' };
    const res = await POST(makePost(body));
    expect(res.status).toBe(200);
    expect(insertChain.insert).toHaveBeenCalled();
  });
});
