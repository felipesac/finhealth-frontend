# Story FH-1.3: Migrate rate limiting to Upstash Redis

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 1 — Security Hardening
**Points:** 5
**Priority:** High
**Status:** Pending
**Agent:** @dev

---

## Context

The Brownfield Discovery (Phase 4 finding SEC-3) identified that the current in-memory rate limiter uses a JavaScript `Map` that resets on every Vercel serverless cold start. On Vercel with multiple instances, rate limits are per-instance and ephemeral, making them ineffective against abuse.

Current implementation: `src/lib/rate-limit.ts` — Map-based with 5-minute cleanup interval.

## Acceptance Criteria

- [ ] Replace in-memory Map with Upstash Redis (`@upstash/ratelimit`)
- [ ] Maintain same rate limit configuration (limits per endpoint group)
- [ ] Rate limits persist across cold starts and instances
- [ ] Fallback to in-memory if Redis is unavailable (graceful degradation)
- [ ] Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to env config
- [ ] Update `.env.example` with new variables
- [ ] Update `src/lib/env.ts` to validate new env vars (optional, with fallback)
- [ ] Maintain existing `rateLimit()`, `getRateLimitKey()`, `withRateLimitHeaders()` API
- [ ] All existing tests pass (mock Redis in tests)

## Technical Notes

- Upstash Redis is Vercel-native and has a generous free tier
- `@upstash/ratelimit` provides sliding window algorithm out of the box
- Keep the same function signatures so API routes don't need changes
- Add Redis URL/token to Vercel environment variables

## Files to Modify

- `src/lib/rate-limit.ts` (REWRITE)
- `src/lib/env.ts` (ADD optional Redis env vars)
- `.env.example` (ADD Redis vars)
- `package.json` (ADD @upstash/redis, @upstash/ratelimit)
- Rate limit test file (UPDATE mocks)

## Definition of Done

- [ ] Rate limiting works across multiple Vercel instances
- [ ] Rate limit state persists across cold starts
- [ ] Graceful fallback if Redis unavailable
- [ ] All API routes continue to work
- [ ] `npm test` passes
- [ ] `npm run typecheck` passes
- [ ] Env vars configured in Vercel dashboard
