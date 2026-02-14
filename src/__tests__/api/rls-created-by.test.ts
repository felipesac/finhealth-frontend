import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * RLS INSERT Tests — FH-1.1
 *
 * Verifies that POST routes for core tables do NOT include created_by
 * (column does not exist in the DB schema; ownership is handled by
 * RLS DEFAULT auth.uid() once the column is added via migration).
 */

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rbac', () => ({ checkPermission: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(), getRateLimitKey: vi.fn().mockReturnValue('k') }));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn(), getClientIp: vi.fn().mockReturnValue('127.0.0.1') }));

import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit } from '@/lib/rate-limit';

function allowRate() {
  (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, remaining: 19, resetAt: 0 });
}

function allowAuth(userId = 'user-1') {
  (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    authorized: true,
    userId,
    email: 'admin@test.com',
    role: 'admin',
  });
}

function createMockSupa() {
  const insertSpy = vi.fn();
  const chain: Record<string, unknown> = {};
  ['from', 'select', 'update', 'delete', 'eq', 'order', 'limit'].forEach(m => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.insert = insertSpy.mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null });
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null });
  chain.then = (resolve: (v: unknown) => void) => resolve({ data: { id: 'new-id' }, error: null });

  const sb = {
    from: vi.fn().mockReturnValue(chain),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'admin@test.com', user_metadata: { role: 'admin' } } },
      }),
    },
  };

  (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(sb);

  return { sb, insertSpy };
}

// Import route handlers statically (after mocks are set up)
import { POST as accountsPost } from '@/app/api/accounts/route';
import { POST as glosasPost } from '@/app/api/glosas/route';
import { POST as paymentsPost } from '@/app/api/payments/route';

describe('API route INSERT does not include created_by', () => {
  let insertSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    allowRate();
    allowAuth('user-1');
    const mocks = createMockSupa();
    insertSpy = mocks.insertSpy;
  });

  it('accounts POST omits created_by from insert payload', async () => {
    const req = new Request('http://localhost/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_number: 'ACC-001',
        patient_id: '550e8400-e29b-41d4-a716-446655440001',
        health_insurer_id: '550e8400-e29b-41d4-a716-446655440000',
        account_type: 'ambulatorial',
        admission_date: '2026-01-15',
        total_amount: 1000,
      }),
    });

    await accountsPost(req);

    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy.mock.calls[0][0]).not.toHaveProperty('created_by');
  });

  it('glosas POST omits created_by from insert payload', async () => {
    const req = new Request('http://localhost/api/glosas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medical_account_id: '550e8400-e29b-41d4-a716-446655440000',
        glosa_code: 'G001',
        glosa_type: 'administrativa',
        glosa_amount: 500,
        original_amount: 1000,
      }),
    });

    await glosasPost(req);

    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy.mock.calls[0][0]).not.toHaveProperty('created_by');
  });

  it('payments POST omits created_by from insert payload', async () => {
    const req = new Request('http://localhost/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        health_insurer_id: '550e8400-e29b-41d4-a716-446655440000',
        payment_date: '2026-01-15',
        total_amount: 5000,
      }),
    });

    await paymentsPost(req);

    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy.mock.calls[0][0]).not.toHaveProperty('created_by');
  });
});
