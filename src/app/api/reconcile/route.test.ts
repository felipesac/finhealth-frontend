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
  paymentId: '550e8400-e29b-41d4-a716-446655440001',
  accountId: '550e8400-e29b-41d4-a716-446655440002',
};

function makeReq(body: unknown) {
  return new Request('http://localhost/api/reconcile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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

function allowRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, remaining: 19, resetAt: 0 }); }
function denyRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: false, remaining: 0, resetAt: 0 }); }
function allowAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: true, userId: 'u1', email: 'a@b.com', role: 'finance_manager' }); }
function denyAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: false, status: 401, error: 'Denied' }); }

describe('POST /api/reconcile', () => {
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
    const res = await POST(makeReq({ paymentId: 'bad' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when payment not found', async () => {
    allowRate(); allowAuth();
    const supabase = { from: vi.fn() };
    supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'not found' } }));
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(404);
  });

  it('returns 409 when payment already matched', async () => {
    allowRate(); allowAuth();
    const paymentChain = mockChain({
      data: { total_amount: 10000, matched_amount: 10000, unmatched_amount: 0, reconciliation_status: 'matched' },
      error: null,
    });
    const supabase = { from: vi.fn().mockReturnValue(paymentChain) };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(409);
  });

  it('reconciles successfully', async () => {
    allowRate(); allowAuth();
    const paymentSelectChain = mockChain({
      data: { total_amount: 10000, matched_amount: 5000, unmatched_amount: 5000, reconciliation_status: 'partial' },
      error: null,
    });
    const accountSelectChain = mockChain({
      data: { total_amount: 8000, paid_amount: 3000 },
      error: null,
    });
    const updateChain = mockChain({ data: null, error: null });

    const supabase = { from: vi.fn() };
    supabase.from
      .mockReturnValueOnce(paymentSelectChain)
      .mockReturnValueOnce(accountSelectChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(updateChain);
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.amountMatched).toBe(5000);
  });

  it('returns 404 when account not found', async () => {
    allowRate(); allowAuth();
    const paymentChain = mockChain({
      data: { total_amount: 10000, matched_amount: 0, unmatched_amount: 10000, reconciliation_status: 'pending' },
      error: null,
    });
    const accountChain = mockChain({ data: null, error: { message: 'not found' } });
    const supabase = { from: vi.fn() };
    supabase.from
      .mockReturnValueOnce(paymentChain)
      .mockReturnValueOnce(accountChain);
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(404);
  });
});
