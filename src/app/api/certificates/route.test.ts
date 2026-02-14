import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/rbac', () => ({ checkPermission: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(), getRateLimitKey: vi.fn().mockReturnValue('k') }));
vi.mock('@/lib/audit-logger', () => ({ auditLog: vi.fn(), getClientIp: vi.fn().mockReturnValue('127.0.0.1') }));
vi.mock('@/lib/certificate-parser', () => ({
  parsePfxCertificate: vi.fn(),
  MAX_CERTIFICATE_SIZE: 2 * 1024 * 1024,
  ALLOWED_CERTIFICATE_EXTENSIONS: ['.pfx', '.p12'],
}));

import { POST, GET, DELETE } from './route';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit } from '@/lib/rate-limit';
import { parsePfxCertificate } from '@/lib/certificate-parser';

const validUpload = {
  fileName: 'cert.pfx',
  fileData: Buffer.from('fake-cert').toString('base64'),
  password: 'secret',
  name: 'My Certificate',
};

function makePost(body: unknown) {
  return new Request('http://localhost/api/certificates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetReq() {
  return new Request('http://localhost/api/certificates');
}

function makeDelete(id?: string) {
  const url = id ? `http://localhost/api/certificates?id=${id}` : 'http://localhost/api/certificates';
  return new Request(url, { method: 'DELETE' });
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

function mockSupa(...results: Array<{ data?: unknown; error?: unknown }>) {
  const sb = { from: vi.fn() };
  results.forEach(r => sb.from.mockReturnValueOnce(mockChain(r)));
  return sb;
}

function allowRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: true, remaining: 4, resetAt: 0 }); }
function denyRate() { (rateLimit as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ success: false, remaining: 0, resetAt: 0 }); }
function allowAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: true, userId: 'u1', email: 'a@b.com', role: 'finance_manager' }); }
function denyAuth() { (checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ authorized: false, status: 401, error: 'Denied' }); }

describe('POST /api/certificates', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 429 when rate limited', async () => {
    denyRate();
    const res = await POST(makePost(validUpload));
    expect(res.status).toBe(429);
  });

  it('returns 401 when not authenticated', async () => {
    allowRate(); denyAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await POST(makePost(validUpload));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await POST(makePost({ fileName: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid file extension', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await POST(makePost({ ...validUpload, fileName: 'cert.pem' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Formato');
  });

  it('returns 400 when certificate is invalid', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (parsePfxCertificate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: false,
      certificate: null,
      errors: ['Senha incorreta'],
      warnings: [],
    });
    const res = await POST(makePost(validUpload));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Senha');
  });

  it('returns 409 for duplicate certificate', async () => {
    allowRate(); allowAuth();
    (parsePfxCertificate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      certificate: { commonName: 'Test', serialNumber: '123', issuer: 'CA', subject: 'CN=Test', validFrom: '2024-01-01', validTo: '2025-01-01', cnpj: null, cpf: null },
      errors: [],
      warnings: [],
    });
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: { id: 'existing' }, error: null }),
    );
    const res = await POST(makePost(validUpload));
    expect(res.status).toBe(409);
  });

  it('uploads certificate successfully', async () => {
    allowRate(); allowAuth();
    (parsePfxCertificate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      certificate: { commonName: 'Test Corp', serialNumber: '123', issuer: 'CA', subject: 'CN=Test Corp', validFrom: '2024-01-01', validTo: '2025-01-01', cnpj: '12345678901234', cpf: null },
      errors: [],
      warnings: [],
    });
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa(
        { data: null, error: null },   // duplicate check
        { data: null, error: null },   // replace existing
        { data: { id: 'cert-1', name: 'My Certificate', common_name: 'Test Corp' }, error: null }, // insert
      ),
    );

    const res = await POST(makePost(validUpload));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.certificate.id).toBe('cert-1');
  });
});

describe('GET /api/certificates', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 401 when not authenticated', async () => {
    allowRate(); denyAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
  });

  it('returns certificates list', async () => {
    allowRate(); allowAuth();
    const certs = [{ id: 'c1', name: 'Cert 1', status: 'active' }];
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: certs, error: null }),
    );
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.certificates).toHaveLength(1);
  });
});

describe('DELETE /api/certificates', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 400 when id is missing', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await DELETE(makeDelete());
    expect(res.status).toBe(400);
  });

  it('deletes certificate successfully', async () => {
    allowRate(); allowAuth();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupa({ data: null, error: null }),
    );
    const res = await DELETE(makeDelete('cert-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
