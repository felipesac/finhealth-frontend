import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Types (unchanged public API)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// In-memory fallback (used when Redis is unavailable)
// ---------------------------------------------------------------------------

const rateMap = new Map<string, { count: number; resetAt: number }>();
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

function inMemoryRateLimit(
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

// ---------------------------------------------------------------------------
// Redis setup (singleton, lazy)
// ---------------------------------------------------------------------------

let redis: Redis | null = null;
let redisAvailable: boolean | null = null;

function getRedis(): Redis | null {
  if (redisAvailable === false) return null;
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisAvailable = false;
    return null;
  }

  try {
    redis = new Redis({ url, token });
    redisAvailable = true;
    return redis;
  } catch {
    redisAvailable = false;
    return null;
  }
}

// Cache Ratelimit instances per config key to avoid re-creating them
const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(
  redisInstance: Redis,
  { limit, windowSeconds }: RateLimitConfig
): Ratelimit {
  const cacheKey = `${limit}:${windowSeconds}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redisInstance,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: 'finhealth:rl',
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

// ---------------------------------------------------------------------------
// Public API (signatures unchanged)
// ---------------------------------------------------------------------------

/**
 * Rate limiter backed by Upstash Redis (persistent across Vercel instances).
 * Falls back to in-memory Map when Redis env vars are not configured.
 * Returns { success, remaining, resetAt }.
 */
export async function rateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redisInstance = getRedis();

  if (!redisInstance) {
    return inMemoryRateLimit(key, config);
  }

  try {
    const limiter = getUpstashLimiter(redisInstance, config);
    const res = await limiter.limit(key);
    return {
      success: res.success,
      remaining: res.remaining,
      resetAt: res.reset,
    };
  } catch {
    return inMemoryRateLimit(key, config);
  }
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
