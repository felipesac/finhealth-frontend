import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rbac', () => ({ checkPermission: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
  getRateLimitKey: vi.fn().mockReturnValue('test-key'),
}));

import { GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';

function makeGet(params = '') {
  return new Request(`http://localhost/api/tuss${params}`);
}

function mockChain(result: { data?: unknown; error?: unknown } = { data: [], error: null }) {
  const c: Record<string, unknown> = {};
  ['from', 'select', 'insert', 'update', 'delete', 'eq', 'or', 'order', 'limit'].forEach(m => {
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

function allowAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: true, userId: 'u1', email: 'a@b.com', role: 'finance_manager' }); }
function denyAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: false, status: 401, error: 'Denied' }); }

describe('GET /api/tuss', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 401 when not authenticated', async () => {
    denyAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await GET(makeGet());
    expect(res.status).toBe(401);
  });

  it('returns TUSS procedures', async () => {
    allowAuth();
    const procedures = [
      { code: '10101012', description: 'Consulta', active: true },
      { code: '40301010', description: 'Hemograma', active: true },
    ];
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: procedures, error: null }),
    );
    const res = await GET(makeGet());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(2);
  });

  it('filters by search term', async () => {
    allowAuth();
    const procedures = [{ code: '10101012', description: 'Consulta em consultorio', active: true }];
    const chain = mockChain({ data: procedures, error: null });
    const supabase = { from: vi.fn().mockReturnValue(chain) };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const res = await GET(makeGet('?search=consulta'));
    expect(res.status).toBe(200);
    expect((chain.or as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  });

  it('returns empty when table does not exist', async () => {
    allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: null, error: { code: '42P01', message: 'table not found' } }),
    );
    const res = await GET(makeGet());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: null, error: { code: 'PGRST', message: 'DB fail' } }),
    );
    const res = await GET(makeGet());
    expect(res.status).toBe(500);
  });
});
