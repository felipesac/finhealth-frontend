# Epic: FinHealth Security & Quality Hardening

**Epic ID:** FINHEALTH-EPIC-3
**Origin:** Post-Brownfield Audit (2026-02-14)
**Priority:** High
**Status:** Ready for Development
**Created:** 2026-02-14
**Owner:** @po (Pax)

---

## Objective

Address security vulnerabilities (4 High CVEs in Next.js 14), missing security headers, and testing gaps identified in the post-brownfield audit. Brings the project to production-grade security posture and >80% test coverage.

## Audit Findings Addressed

| # | Finding | Severity | Story |
|---|---------|----------|-------|
| 1 | Next.js 14 has 4 High CVEs (DoS, HTTP deserialization) | Critical | FH-5.1 |
| 2 | Missing security headers (CSP, HSTS, X-Frame-Options) | High | FH-5.2 |
| 3 | 3 pages still using raw fetch+useState+useEffect | Medium | FH-5.3 |
| 4 | 13 custom hooks without unit tests | Medium | FH-5.4 |
| 5 | 4 components without tests (modals, filters) | Medium | FH-5.5 |
| 6 | No coverage tooling configured | Low | FH-5.6 |

## Success Criteria

- [ ] Zero npm audit vulnerabilities (High+)
- [ ] Security headers on all responses (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] All data fetching uses TanStack Query (no raw fetch+useState patterns)
- [ ] All custom hooks have unit tests
- [ ] Coverage tooling configured and reporting
- [ ] All existing tests continue passing

## Stories

| Story | Title | Sprint | Points | Priority | Status |
|-------|-------|--------|--------|----------|--------|
| FH-5.1 | Upgrade Next.js 14 to 15 | Sprint 5 | 8 | Critical | Done |
| FH-5.2 | Add security headers to middleware | Sprint 5 | 2 | High | Done |
| FH-5.3 | Migrate remaining pages to TanStack Query | Sprint 5 | 3 | Medium | Ready for Development |
| FH-5.4 | Add unit tests for custom hooks | Sprint 6 | 5 | Medium | Ready for Development |
| FH-5.5 | Add tests for modal and filter components | Sprint 6 | 3 | Medium | Ready for Development |
| FH-5.6 | Setup test coverage tooling | Sprint 6 | 1 | Low | Ready for Development |

**Total Story Points:** 22

## Dependencies

- FH-5.1 (Next.js upgrade) should be done first — may require adjustments in other stories
- FH-5.6 (coverage) should be done before FH-5.4/FH-5.5 to measure impact
- FH-5.2 and FH-5.3 are independent and can be done in parallel

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Next.js 15 breaking changes | Incremental upgrade, test suite as safety net |
| CSP breaks third-party scripts | Start with report-only mode |
| React 19 not included | Staying on React 18 with Next.js 15 is supported |

---

*Created by @architect from post-brownfield audit findings*
