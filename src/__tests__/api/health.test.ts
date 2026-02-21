import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockChain } = vi.hoisted(() => {
  const mockChain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };
  return { mockChain };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => mockChain),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 59, resetAt: Date.now() + 60000 }),
  getRateLimitKey: vi.fn().mockReturnValue('health:127.0.0.1'),
}));

import { GET } from '@/app/api/health/route';
import { rateLimit } from '@/lib/rate-limit';

function makeReq() {
  return new Request('http://localhost:3000/api/health', { method: 'GET' });
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of ['select', 'limit']) {
      mockChain[key].mockReturnValue(mockChain);
    }
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: [{ id: 'insurer-1' }],
      error: null,
    }));
  });

  it('returns 200 healthy when DB is reachable', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.services.db).toBe('healthy');
    expect(body.timestamp).toBeDefined();
  });

  it('returns 503 unhealthy when DB fails', async () => {
    (mockChain as Record<string, unknown>).then = vi.fn((resolve: (v: unknown) => void) => resolve({
      data: null,
      error: { message: 'connection refused' },
    }));
    const res = await GET(makeReq());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe('unhealthy');
    expect(body.services.db).toBe('unhealthy');
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetAt: Date.now() + 60000 });
    const res = await GET(makeReq());
    expect(res.status).toBe(429);
  });
});
