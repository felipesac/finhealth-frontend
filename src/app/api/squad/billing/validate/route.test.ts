import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rbac', () => ({ checkPermission: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(), getRateLimitKey: vi.fn().mockReturnValue('k') }));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn(), getClientIp: vi.fn().mockReturnValue('127.0.0.1') }));
vi.mock('@/lib/squad-client', () => ({
  createSquadClient: vi.fn().mockReturnValue({
    execute: vi.fn().mockResolvedValue({ success: true, output: { valida: true, score_confianca: 95 } }),
  }),
}));

import { POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit } from '@/lib/rate-limit';
import { createSquadClient } from '@/lib/squad-client';

const validBody = {
  guia: {
    tipo: 'consulta',
    numero_guia: '12345',
    data_atendimento: '2026-01-15',
    beneficiario: { numero_carteira: '999', nome: 'Teste', data_nascimento: '1990-01-01' },
    prestador: { codigo_cnes: '1234567', nome: 'Hospital Teste', tipo: 'hospital' },
    procedimentos: [{ codigo_tuss: '10101012', descricao: 'Consulta', quantidade: 1, valor_unitario: 150 }],
  },
  operadora: { codigo_ans: '123456', nome: 'Operadora Teste' },
};

function makeReq(body: unknown) {
  return new Request('http://localhost/api/squad/billing/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function allowRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, remaining: 9, resetAt: 0 }); }
function denyRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: false, remaining: 0, resetAt: 0 }); }
function allowAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: true, userId: 'u1', email: 'a@b.com', role: 'finance_manager' }); }
function denyAuth(status: 401 | 403 = 401) { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: false, status, error: 'Denied' }); }

describe('POST /api/squad/billing/validate', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 429 when rate limited', async () => {
    denyRate();
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(429);
  });

  it('returns 401 when not authenticated', async () => {
    allowRate(); denyAuth(401);
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 403 when forbidden', async () => {
    allowRate(); denyAuth(403);
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid body', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await POST(makeReq({ guia: { tipo: 'invalid' } }));
    expect(res.status).toBe(400);
  });

  it('returns 502 when squad agent fails', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const mockClient = { execute: vi.fn().mockResolvedValue({ success: false, output: null, errors: ['Agent error'] }) };
    (createSquadClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.details).toContain('Agent error');
  });

  it('returns 200 with squad result on success', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const mockClient = { execute: vi.fn().mockResolvedValue({ success: true, output: { valida: true, score_confianca: 95 } }) };
    (createSquadClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.valida).toBe(true);
  });
});
