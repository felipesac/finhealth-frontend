import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rbac', () => ({ checkPermission: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(), getRateLimitKey: vi.fn().mockReturnValue('k') }));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn(), getClientIp: vi.fn().mockReturnValue('127.0.0.1') }));
vi.mock('@/lib/squad-client', () => ({
  createSquadClient: vi.fn().mockReturnValue({
    execute: vi.fn().mockResolvedValue({ success: true, output: { cenarios: {} } }),
  }),
}));

import { POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit } from '@/lib/rate-limit';
import { createSquadClient } from '@/lib/squad-client';

const validBody = {
  periodo_projecao: 30,
  posicao_atual: { saldo_caixa: 100000, data_referencia: '2026-02-01' },
  recebiveis: [{ operadora: 'Operadora A', valor: 50000, data_prevista: '2026-02-15' }],
  compromissos: [{ descricao: 'Folha', valor: 30000, data_vencimento: '2026-02-05', tipo: 'fixo' }],
};

function makeReq(body: unknown) {
  return new Request('http://localhost/api/squad/cashflow/forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function allowRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, remaining: 9, resetAt: 0 }); }
function denyRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: false, remaining: 0, resetAt: 0 }); }
function allowAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: true, userId: 'u1', email: 'a@b.com', role: 'finance_manager' }); }
function denyAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: false, status: 403, error: 'Forbidden' }); }

describe('POST /api/squad/cashflow/forecast', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 429 when rate limited', async () => {
    denyRate();
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(429);
  });

  it('returns 403 when forbidden', async () => {
    allowRate(); denyAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid body', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await POST(makeReq({ periodo_projecao: -5 }));
    expect(res.status).toBe(400);
  });

  it('returns 502 when squad agent fails', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (createSquadClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      execute: vi.fn().mockResolvedValue({ success: false, output: null, errors: ['Forecast error'] }),
    });

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(502);
  });

  it('returns 200 with forecast on success', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (createSquadClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      execute: vi.fn().mockResolvedValue({
        success: true,
        output: { cenarios: { otimista: {}, realista: {}, pessimista: {} }, confianca_modelo: 0.85 },
      }),
    });

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.confianca_modelo).toBe(0.85);
  });
});
