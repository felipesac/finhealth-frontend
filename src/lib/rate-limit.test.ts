import { describe, it, expect, vi } from 'vitest';
import { rateLimit, getRateLimitKey } from './rate-limit';

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `test-allow-${Date.now()}`;
    const result = rateLimit(key, { limit: 5, windowSeconds: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('tracks count correctly', () => {
    const key = `test-count-${Date.now()}`;
    rateLimit(key, { limit: 3, windowSeconds: 60 });
    rateLimit(key, { limit: 3, windowSeconds: 60 });
    const result = rateLimit(key, { limit: 3, windowSeconds: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('blocks requests over the limit', () => {
    const key = `test-block-${Date.now()}`;
    rateLimit(key, { limit: 2, windowSeconds: 60 });
    rateLimit(key, { limit: 2, windowSeconds: 60 });
    const result = rateLimit(key, { limit: 2, windowSeconds: 60 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    const key = `test-reset-${Date.now()}`;
    vi.useFakeTimers();

    rateLimit(key, { limit: 1, windowSeconds: 10 });
    const blocked = rateLimit(key, { limit: 1, windowSeconds: 10 });
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(11000);

    const allowed = rateLimit(key, { limit: 1, windowSeconds: 10 });
    expect(allowed.success).toBe(true);

    vi.useRealTimers();
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
