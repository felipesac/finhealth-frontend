# Story FH-1.3: Migrate rate limiting to Upstash Redis

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 1 — Security Hardening
**Points:** 5
**Priority:** High
**Status:** Ready for Review
**Agent:** @dev

---

## Context

The Brownfield Discovery (Phase 4 finding SEC-3) identified that the current in-memory rate limiter uses a JavaScript `Map` that resets on every Vercel serverless cold start. On Vercel with multiple instances, rate limits are per-instance and ephemeral, making them ineffective against abuse.

Current implementation: `src/lib/rate-limit.ts` — Map-based with 5-minute cleanup interval.

## Acceptance Criteria

- [x] Replace in-memory Map with Upstash Redis (`@upstash/ratelimit`)
- [x] Maintain same rate limit configuration (limits per endpoint group)
- [x] Rate limits persist across cold starts and instances
- [x] Fallback to in-memory if Redis is unavailable (graceful degradation)
- [x] Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to env config
- [x] Update `.env.example` with new variables
- [x] Update `src/lib/env.ts` to validate new env vars (optional, with fallback)
- [x] Maintain existing `rateLimit()`, `getRateLimitKey()`, `withRateLimitHeaders()` API
- [x] All existing tests pass (mock Redis in tests)

## Technical Notes

- Upstash Redis is Vercel-native and has a generous free tier
- `@upstash/ratelimit` provides sliding window algorithm out of the box
- Keep the same function signatures so API routes don't need changes
- Add Redis URL/token to Vercel environment variables

## Files to Modify

- `src/lib/rate-limit.ts` (REWRITE) [x]
- `src/lib/env.ts` (ADD optional Redis env vars) [x]
- `.env.example` (ADD Redis vars) [x]
- `package.json` (ADD @upstash/redis, @upstash/ratelimit) [x]
- `src/lib/rate-limit.test.ts` (UPDATE mocks to async) [x]
- `src/__tests__/api/appeals.test.ts` (FIX mockResolvedValueOnce) [x]
- `src/__tests__/api/export.test.ts` (FIX mockResolvedValueOnce) [x]
- `src/__tests__/api/reconcile.test.ts` (FIX mockResolvedValueOnce) [x]
- `src/__tests__/api/tiss-upload.test.ts` (FIX mockResolvedValueOnce) [x]
- 25 API route files (ADD await before rateLimit calls) [x]

## Definition of Done

- [x] Rate limiting works across multiple Vercel instances
- [x] Rate limit state persists across cold starts
- [x] Graceful fallback if Redis unavailable
- [x] All API routes continue to work
- [x] `npm test` passes
- [x] `npm run typecheck` passes
- [ ] Env vars configured in Vercel dashboard
