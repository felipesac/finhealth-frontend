# Story FH-5.2: Add security headers to middleware

**Epic:** FINHEALTH-EPIC-3 (Security & Quality Hardening)
**Sprint:** 5 — Security
**Points:** 2
**Priority:** High
**Status:** Ready for Development
**Agent:** @dev

---

## Context

Post-brownfield audit found the middleware only validates CSRF origin but does not set security response headers. This leaves the application vulnerable to clickjacking, MIME sniffing, and lacks transport security enforcement.

## Acceptance Criteria

- [ ] Add `X-Content-Type-Options: nosniff` to all responses
- [ ] Add `X-Frame-Options: DENY` to all responses
- [ ] Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` to all responses
- [ ] Add `Referrer-Policy: strict-origin-when-cross-origin` to all responses
- [ ] Add `X-DNS-Prefetch-Control: on` to all responses
- [ ] Add `Permissions-Policy` header restricting camera, microphone, geolocation
- [ ] Add basic `Content-Security-Policy` header (report-only mode initially)
- [ ] Security headers do NOT break existing functionality (charts, fonts, icons)
- [ ] Add tests for security headers in middleware

## Files to Modify

- `src/middleware.ts` — add security headers to response
- `src/middleware.test.ts` or new test file — verify headers

## Technical Notes

### CSP Strategy
Start with `Content-Security-Policy-Report-Only` to avoid breaking anything:
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
```

Once validated in production, switch to enforcing mode in a follow-up.

### Headers to skip
- `X-XSS-Protection` — deprecated, modern browsers don't need it
- `X-Powered-By` — Next.js already removes this by default

## Definition of Done

- [ ] All 6 security headers present on responses
- [ ] Existing pages render correctly (no CSP violations breaking functionality)
- [ ] All tests pass
- [ ] Production build succeeds
