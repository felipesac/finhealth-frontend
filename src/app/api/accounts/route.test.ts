import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rbac', () => ({ checkPermission: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(), getRateLimitKey: vi.fn().mockReturnValue('k') }));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn(), getClientIp: vi.fn().mockReturnValue('127.0.0.1') }));

import { POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit } from '@/lib/rate-limit';

const validBody = {
  account_number: 'CT-100',
  patient_id: '550e8400-e29b-41d4-a716-446655440001',
  health_insurer_id: '550e8400-e29b-41d4-a716-446655440002',
  account_type: 'internacao',
  admission_date: '2024-01-15',
  total_amount: 5000,
};

function makeReq(body: unknown) {
  return new Request('http://localhost/api/accounts', {
    method: 'POST',
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

function allowRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, remaining: 19, resetAt: 0 }); }
function denyRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: false, remaining: 0, resetAt: 0 }); }
function allowAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: true, userId: 'u1', email: 'a@b.com', role: 'finance_manager' }); }
function denyAuth(status = 401) { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: false, status, error: 'Denied' }); }

describe('POST /api/accounts', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 429 when rate limited', async () => {
    denyRate();
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(429);
  });

  it('returns 401 when not authenticated', async () => {
    allowRate(); denyAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('returns 500 on insert error', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: null, error: { message: 'DB error' } }),
    );
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('DB error');
  });

  it('creates account successfully', async () => {
    allowRate(); allowAuth();
    const inserted = { id: 'new-1', ...validBody };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: inserted, error: null }),
    );
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('new-1');
  });
});
