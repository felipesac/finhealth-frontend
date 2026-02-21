import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rbac', () => ({ checkPermission: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(), getRateLimitKey: vi.fn().mockReturnValue('k') }));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn(), getClientIp: vi.fn().mockReturnValue('127.0.0.1') }));
vi.mock('@/lib/squad-client', () => ({
  createSquadClient: vi.fn().mockReturnValue({
    execute: vi.fn().mockResolvedValue({ success: true, output: { score_risco_glosa: 25 } }),
  }),
}));

import { POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit } from '@/lib/rate-limit';
import { createSquadClient } from '@/lib/squad-client';

const validBody = {
  conta: {
    id: 'conta-001',
    paciente: { nome: 'Paciente Teste', idade: 45, sexo: 'M' },
    procedimentos: [{ codigo_tuss: '10101012', descricao: 'Consulta', quantidade: 1, valor: 150, data_execucao: '2026-01-15', profissional_executante: 'Dr. Teste' }],
    materiais: [],
    medicamentos: [],
    diarias: [],
    valor_total: 150,
  },
  operadora: { codigo_ans: '123456', nome: 'Operadora Teste' },
};

function makeReq(body: unknown) {
  return new Request('http://localhost/api/squad/audit/account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function allowRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, remaining: 4, resetAt: 0 }); }
function denyRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: false, remaining: 0, resetAt: 0 }); }
function allowAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: true, userId: 'u1', email: 'a@b.com', role: 'finance_manager' }); }
function denyAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: false, status: 401, error: 'Denied' }); }

describe('POST /api/squad/audit/account', () => {
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
    const res = await POST(makeReq({ conta: {} }));
    expect(res.status).toBe(400);
  });

  it('returns 502 when squad agent fails', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (createSquadClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      execute: vi.fn().mockResolvedValue({ success: false, output: null, errors: ['Audit failed'] }),
    });

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(502);
  });

  it('returns 200 with audit result on success', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (createSquadClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      execute: vi.fn().mockResolvedValue({ success: true, output: { score_risco_glosa: 25, classificacao: 'baixo' } }),
    });

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.score_risco_glosa).toBe(25);
  });
});
