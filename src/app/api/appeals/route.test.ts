import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rbac', () => ({ checkPermission: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(), getRateLimitKey: vi.fn().mockReturnValue('k') }));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn(), getClientIp: vi.fn().mockReturnValue('127.0.0.1') }));

import { PATCH } from './route';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit } from '@/lib/rate-limit';

const validSubmit = {
  glosaId: '550e8400-e29b-41d4-a716-446655440001',
  text: 'Justificativa do recurso',
  action: 'submit',
};

const validDraft = { ...validSubmit, action: 'save_draft' };

function makeReq(body: unknown) {
  return new Request('http://localhost/api/appeals', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockChain(result: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const c: Record<string, unknown> = {};
  ['from', 'select', 'insert', 'update', 'delete', 'eq', 'order', 'limit'].forEach(m => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  c.single = vi.fn().mockResolvedValue(result);
  c.maybeSingle = vi.fn().mockResolvedValue(result);
  c.then = (resolve: (v: unknown) => void) => resolve(result);
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

describe('PATCH /api/appeals', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 429 when rate limited', async () => {
    denyRate();
    const res = await PATCH(makeReq(validSubmit));
    expect(res.status).toBe(429);
  });

  it('returns 401 when not authenticated', async () => {
    allowRate(); denyAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await PATCH(makeReq(validSubmit));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await PATCH(makeReq({ glosaId: 'not-uuid' }));
    expect(res.status).toBe(400);
  });

  it('submits appeal successfully', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: null, error: null }),
    );
    const res = await PATCH(makeReq(validSubmit));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain('enviado');
  });

  it('saves draft successfully', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: null, error: null }),
    );
    const res = await PATCH(makeReq(validDraft));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain('Rascunho');
  });

  it('returns 500 on database error', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: null, error: { message: 'DB fail' } }),
    );
    const res = await PATCH(makeReq(validSubmit));
    expect(res.status).toBe(500);
  });
});
