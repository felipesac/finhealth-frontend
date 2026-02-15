import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  process.env.N8N_TISS_WEBHOOK_URL = '';
});

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rbac', () => ({ checkPermission: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(), getRateLimitKey: vi.fn().mockReturnValue('k') }));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn(), getClientIp: vi.fn().mockReturnValue('127.0.0.1') }));
vi.mock('@/lib/sanitize-xml', () => ({ sanitizeXml: vi.fn().mockImplementation((xml: string) => xml) }));

import { POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit } from '@/lib/rate-limit';

const validBody = { xml: '<TISS><header/></TISS>', accountId: '550e8400-e29b-41d4-a716-446655440000' };

const validTissXml = `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <ans:cabecalho>
    <ans:versaoPadrao>3.05.00</ans:versaoPadrao>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:guiasTISS>
        <ans:guiaSP-SADT>
          <ans:cabecalhoGuia>
            <ans:numeroGuiaPrestador>12345</ans:numeroGuiaPrestador>
          </ans:cabecalhoGuia>
        </ans:guiaSP-SADT>
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
</ans:mensagemTISS>`;

function makeReq(body: unknown) {
  return new Request('http://localhost/api/tiss/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function allowRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, remaining: 9, resetAt: 0 }); }
function denyRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: false, remaining: 0, resetAt: 0 }); }
function allowAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: true, userId: 'u1', email: 'a@b.com', role: 'finance_manager', organizationId: 'org-1' }); }
function denyAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: false, status: 401, error: 'Denied' }); }

function mockSupabaseUpdate(error: { message: string } | null = null) {
  const eqChain = {
    eq: vi.fn().mockResolvedValue({ error }),
  };
  eqChain.eq.mockReturnValue(eqChain);
  // Resolve when awaited after all .eq() calls
  (eqChain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve({ error });
  const update = vi.fn().mockReturnValue(eqChain);
  (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    from: vi.fn().mockReturnValue({ update }),
  });
  return update;
}

describe('POST /api/tiss/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.N8N_TISS_WEBHOOK_URL = 'http://localhost:5678/webhook/tiss';
    global.fetch = vi.fn();
  });

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
    const res = await POST(makeReq({ xml: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when XML exceeds max size', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const largeXml = 'x'.repeat(6 * 1024 * 1024); // >5MB
    const res = await POST(makeReq({ xml: largeXml }));
    expect(res.status).toBe(400);
  });

  it('uploads XML and returns n8n result', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ success: true, guides: 3 })),
    });

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5678/webhook/tiss',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns error when n8n webhook fails', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 502,
      text: vi.fn().mockResolvedValue('Bad Gateway'),
    });

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(502);
  });
});

describe('POST /api/tiss/upload (local processing)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.N8N_TISS_WEBHOOK_URL = '';
    global.fetch = vi.fn();
  });

  it('processes valid TISS XML locally and updates account', async () => {
    allowRate(); allowAuth();
    const update = mockSupabaseUpdate();

    const res = await POST(makeReq({ xml: validTissXml, accountId: '550e8400-e29b-41d4-a716-446655440000' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.isValid).toBe(true);
    expect(json.guideNumber).toBe('12345');
    expect(json.message).toBe('Guia TISS processada com sucesso');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        tiss_guide_number: '12345',
        tiss_guide_type: 'sadt',
        tiss_validation_status: 'valid',
        status: 'validated',
      }),
    );
  });

  it('returns validation errors for invalid XML', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const res = await POST(makeReq({ xml: '<invalid>data</invalid>' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.isValid).toBe(false);
    expect(json.errors).toContain('Elemento raiz mensagemTISS nao encontrado');
  });

  it('processes without accountId (validation only)', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const res = await POST(makeReq({ xml: validTissXml }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.guideNumber).toBe('12345');
  });

  it('returns 500 when Supabase update fails', async () => {
    allowRate(); allowAuth();
    mockSupabaseUpdate({ message: 'DB error' });

    const res = await POST(makeReq({ xml: validTissXml, accountId: '550e8400-e29b-41d4-a716-446655440000' }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('DB error');
  });
});
