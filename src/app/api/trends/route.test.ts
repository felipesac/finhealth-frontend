import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rbac', () => ({ checkPermission: vi.fn() }));

import { GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';

function mockChain(result: { data?: unknown; error?: unknown } = { data: [], error: null }) {
  const c: Record<string, unknown> = {};
  ['from', 'select', 'insert', 'update', 'delete', 'eq', 'gte', 'lte', 'order', 'limit'].forEach(m => {
    (c as Record<string, unknown>)[m] = vi.fn().mockReturnValue(c);
  });
  c.single = vi.fn().mockResolvedValue(result);
  c.maybeSingle = vi.fn().mockResolvedValue(result);
  c.then = (r: (v: unknown) => void) => r(result);
  return c;
}

function allowAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: true, userId: 'u1', email: 'a@b.com', role: 'finance_manager' }); }
function denyAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: false, status: 401, error: 'Denied' }); }

describe('GET /api/trends', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 401 when not authenticated', async () => {
    denyAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const req = new Request('http://localhost/api/trends');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns trend data with forecast', async () => {
    allowAuth();
    const accounts = [
      { total_amount: 10000, glosa_amount: 1000, paid_amount: 8000, created_at: new Date().toISOString() },
    ];
    const glosas = [
      { glosa_amount: 500, glosa_type: 'administrativa', created_at: new Date().toISOString() },
    ];
    const chain = mockChain({ data: accounts, error: null });
    const glosaChain = mockChain({ data: glosas, error: null });
    const supabase = { from: vi.fn() };
    supabase.from
      .mockReturnValueOnce(chain)
      .mockReturnValueOnce(glosaChain);
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);

    const req = new Request('http://localhost/api/trends?months=6');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.monthlyData).toBeDefined();
    expect(json.glosasTrendData).toBeDefined();
    expect(json.forecast).toBeDefined();
    expect(json.forecast.nextMonthBilling).toBeTypeOf('number');
  });

  it('returns zeroed forecast with no data', async () => {
    allowAuth();
    const chain = mockChain({ data: [], error: null });
    const supabase = { from: vi.fn().mockReturnValue(chain) };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);

    const req = new Request('http://localhost/api/trends?months=3');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.forecast.averageGlosaRate).toBe(0);
  });
});
