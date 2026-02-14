# Story FH-5.1: Upgrade Next.js 14 to 15

**Epic:** FINHEALTH-EPIC-3 (Security & Quality Hardening)
**Sprint:** 5 — Security
**Points:** 8
**Priority:** Critical
**Status:** Ready for Development
**Agent:** @dev
**Quality Gate:** @architect

---

## Context

Post-brownfield audit found 4 High severity npm vulnerabilities in Next.js 14.2.35:
- **GHSA-9g9p-9gw9-jx7f**: DoS via Image Optimizer remotePatterns configuration
- **GHSA-h25m-26qc-wcjf**: HTTP request deserialization DoS with insecure RSC
- **GHSA-5j98-mcp5-4vw2**: glob CLI command injection (via eslint-config-next)

Next.js 14 is 2 major versions behind (current: 16.x). Upgrading to 15 resolves all CVEs while staying on React 18 (React 19 upgrade deferred).

## Acceptance Criteria

### Phase 1: Upgrade Core

- [ ] Upgrade `next` from 14.2.35 to latest 15.x
- [ ] Upgrade `eslint-config-next` to matching 15.x version
- [ ] Keep React 18 (Next.js 15 supports React 18)
- [ ] Update `@types/node` if needed
- [ ] Run `npm audit` — zero High+ vulnerabilities

### Phase 2: Fix Breaking Changes

- [ ] Review Next.js 14→15 migration guide for breaking changes
- [ ] Update any deprecated API usage (e.g., `headers()`, `cookies()` now async)
- [ ] Fix any changes to `next/image` behavior
- [ ] Fix any changes to route handler signatures
- [ ] Fix any middleware changes

### Phase 3: Verify

- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run lint` passes
- [ ] `npm test` passes (460+ tests)
- [ ] `npm run build` succeeds
- [ ] Manual smoke test: login, dashboard, navigate all sections
- [ ] Verify Vercel deployment works

## Files to Modify

- `package.json` — version bumps
- `package-lock.json` — regenerated
- `next.config.js` or `next.config.mjs` — any config changes
- Various page/route files — if async API changes needed
- `middleware.ts` — if middleware API changed

## Technical Notes

### Next.js 15 Key Breaking Changes (from 14)
- `headers()`, `cookies()`, `params`, `searchParams` are now async
- `fetch` requests no longer cached by default
- Route Handlers: GET responses no longer cached by default
- `next/image` alt prop now required (may already be set)

### What NOT to upgrade
- React stays at 18.x (React 19 is a separate effort)
- Tailwind stays at 3.x (Tailwind 4 is a separate effort)
- ESLint stays at 8.x (ESLint 9+ flat config is a separate effort)

## Definition of Done

- [ ] `npm audit` shows 0 High+ vulnerabilities
- [ ] All tests pass
- [ ] Production build succeeds
- [ ] No runtime errors on Vercel deployment
