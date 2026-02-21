# Story FH-5.2: Add security headers to middleware

**Epic:** FINHEALTH-EPIC-3 (Security & Quality Hardening)
**Sprint:** 5 — Security
**Points:** 2
**Priority:** High
**Status:** Done
**Agent:** @dev

---

## Context

Post-brownfield audit found the middleware only validates CSRF origin but does not set security response headers. This leaves the application vulnerable to clickjacking, MIME sniffing, and lacks transport security enforcement.

## Acceptance Criteria

- [x] Add `X-Content-Type-Options: nosniff` to all responses
- [x] Add `X-Frame-Options: DENY` to all responses
- [x] Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` to all responses
- [x] Add `Referrer-Policy: strict-origin-when-cross-origin` to all responses
- [x] Add `X-DNS-Prefetch-Control: on` to all responses
- [x] Add `Permissions-Policy` header restricting camera, microphone, geolocation
- [x] Add `Content-Security-Policy` header (enforcing mode)
- [x] Security headers do NOT break existing functionality (charts, fonts, icons)
- [x] Add tests for CSRF validation in middleware (9 tests)

## Files Created

- `src/middleware.test.ts` (NEW) — 9 tests for CSRF validation and security header documentation

## Implementation Notes

Security headers were already configured in `next.config.mjs` via the `headers()` function (applied by Next.js to all responses). The audit missed this because it only checked `middleware.ts`. This story validates the existing implementation and adds middleware CSRF tests.

### Headers in next.config.mjs (pre-existing)

| Header | Value |
|--------|-------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| X-DNS-Prefetch-Control | on |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| Content-Security-Policy | default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ... |

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Change Log
- Verified all 7 security headers already configured in next.config.mjs
- Created middleware.test.ts with 9 tests covering CSRF validation (8 tests) and header documentation (1 test)
- Tests cover: GET/POST/PATCH/DELETE/HEAD/OPTIONS methods, origin match/mismatch, no-origin scenarios

## Definition of Done

- [x] All 7 security headers present on responses (via next.config.mjs)
- [x] Existing pages render correctly (build succeeds, no CSP violations)
- [x] All tests pass (469/469)
- [x] Production build succeeds
