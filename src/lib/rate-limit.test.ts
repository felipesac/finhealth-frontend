import { describe, it, expect, vi } from 'vitest';
import { rateLimit, getRateLimitKey } from './rate-limit';

// Tests run without UPSTASH env vars → exercises in-memory fallback path

describe('rateLimit (in-memory fallback)', () => {
  it('allows requests under the limit', async () => {
    const key = `test-allow-${Date.now()}`;
    const result = await rateLimit(key, { limit: 5, windowSeconds: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('tracks count correctly', async () => {
    const key = `test-count-${Date.now()}`;
    await rateLimit(key, { limit: 3, windowSeconds: 60 });
    await rateLimit(key, { limit: 3, windowSeconds: 60 });
    const result = await rateLimit(key, { limit: 3, windowSeconds: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('blocks requests over the limit', async () => {
    const key = `test-block-${Date.now()}`;
    await rateLimit(key, { limit: 2, windowSeconds: 60 });
    await rateLimit(key, { limit: 2, windowSeconds: 60 });
    const result = await rateLimit(key, { limit: 2, windowSeconds: 60 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', async () => {
    const key = `test-reset-${Date.now()}`;
    vi.useFakeTimers();

    await rateLimit(key, { limit: 1, windowSeconds: 10 });
    const blocked = await rateLimit(key, { limit: 1, windowSeconds: 10 });
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(11000);

    const allowed = await rateLimit(key, { limit: 1, windowSeconds: 10 });
    expect(allowed.success).toBe(true);

    vi.useRealTimers();
  });

  it('returns a promise', () => {
    const key = `test-promise-${Date.now()}`;
    const result = rateLimit(key, { limit: 5, windowSeconds: 60 });
    expect(result).toBeInstanceOf(Promise);
  });
});

describe('getRateLimitKey', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    });
    expect(getRateLimitKey(request, 'test')).toBe('test:192.168.1.1');
  });

  it('falls back to unknown when no IP header', () => {
    const request = new Request('http://localhost');
    expect(getRateLimitKey(request, 'test')).toBe('test:unknown');
  });
});
