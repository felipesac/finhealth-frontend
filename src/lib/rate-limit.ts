const rateMap = new Map<string, { count: number; resetAt: number }>();

/** Cleanup expired entries every 5 minutes to prevent memory leaks */
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of Array.from(rateMap.entries())) {
    if (now > entry.resetAt) {
      rateMap.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * In-memory rate limiter with automatic cleanup of expired entries.
 * Returns { success, remaining, resetAt }.
 */
export function rateLimit(
  key: string,
  { limit, windowSeconds }: RateLimitConfig
): RateLimitResult {
  cleanupExpired();

  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowSeconds * 1000;
    rateMap.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Build a rate-limit key from the request (uses IP or fallback).
 */
export function getRateLimitKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `${prefix}:${ip}`;
}

/**
 * Apply rate-limit headers to a Response.
 */
export function withRateLimitHeaders(
  response: Response,
  result: RateLimitResult,
  limit: number
): Response {
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
  return response;
}
