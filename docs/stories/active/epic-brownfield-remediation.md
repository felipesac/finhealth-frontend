# Epic: FinHealth Brownfield Remediation

**Epic ID:** FINHEALTH-EPIC-1
**Origin:** Brownfield Discovery Assessment (Phases 1-9)
**Priority:** High
**Status:** Ready for Development
**Created:** 2026-02-08
**Updated:** 2026-02-14
**Owner:** @po (Pax)

---

## Objective

Address all Critical and High findings identified during the Brownfield Discovery assessment, reducing technical debt from 31 items to <10 and improving the overall health score from 7.2/10 to 8.5+/10.

## Scope

4 sprints covering: security hardening, data integrity, UX improvements, and polish.

## Architectural Decisions (2026-02-14)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Multi-tenancy model | **B+ (org hierarchy)** | SaaS for hospitals, UBS, clinics — requires organization-level isolation |
| 2 | Form library strategy | **A (react-hook-form + Zod)** | Already installed, shadcn wrapper exists, forms will grow in complexity |
| 3 | Data caching strategy | **B (TanStack Query)** | Cache scoped by org, devtools, mutations — necessary for SaaS |

## Success Criteria

- [ ] Zero Critical findings remaining
- [ ] Zero High findings remaining
- [ ] Multi-tenant RLS with organization isolation on all core tables
- [ ] Client-side form validation on all forms
- [ ] TanStack Query for all data fetching with org-scoped cache
- [ ] All new code has test coverage
- [ ] Health score >= 8.5/10

## Stories

| Story | Title | Sprint | Points | Status |
|-------|-------|--------|--------|--------|
| FH-1.1 | Multi-tenant RLS with organization isolation | Sprint 1 | 13 | Ready for Development |
| FH-1.2 | Add write RLS policies for reference tables | Sprint 1 | 3 | Done |
| FH-1.3 | Migrate rate limiting to Upstash Redis | Sprint 1 | 5 | Ready for Review |
| FH-2.1 | Add missing FK constraints and updated_at columns | Sprint 2 | 3 | Ready for Review |
| FH-2.2 | Add missing CHECK constraints on status columns | Sprint 2 | 2 | Ready for Review |
| FH-2.3 | Integrate client-side form validation with react-hook-form + Zod | Sprint 2 | 8 | Ready for Review |
| FH-2.4 | Resolve dead dependencies (SWR cleanup) | Sprint 2 | 5 | Done |
| FH-2.5 | Migrate data fetching to TanStack Query | Sprint 2 | 5 | Ready for Development |
| FH-3.1 | Replace notification polling with Supabase Realtime | Sprint 3 | 3 | Ready for Review |
| FH-3.2 | Add per-module React Error Boundaries | Sprint 3 | 3 | Ready for Review |
| FH-3.3 | Dynamic import chart components | Sprint 3 | 2 | Ready for Review |
| FH-3.4 | Responsive card layout for mobile tables | Sprint 3 | 5 | Ready for Review |
| FH-4.1 | WCAG AA contrast audit and fixes | Sprint 4 | 3 | Ready for Review |
| FH-4.2 | Migrate hardcoded strings to next-intl message files | Sprint 4 | 8 | Ready for Review |
| FH-4.3 | Accessibility polish (reduced-motion, badge focus, toast aria) | Sprint 4 | 3 | Ready for Review |
| FH-4.4 | Database schema cleanup (redundant indexes, VARCHAR sizes, duplicate function) | Sprint 4 | 2 | Ready for Review |

**Total Story Points:** 73

## Dependencies

- ~~FH-1.1 requires architectural decision on multi-tenancy model~~ → **DECIDED: B+ (org hierarchy)**
- ~~FH-2.3 requires decision on form library strategy~~ → **DECIDED: A (react-hook-form + Zod)**
- ~~FH-2.4 requires decision on data caching strategy~~ → **DECIDED: B (TanStack Query)**
- FH-2.5 (TanStack Query) should be done after FH-1.1 (needs org_id for query keys)
- FH-2.1 requires orphan data cleanup before adding FK constraints
- FH-1.2 reference tables also need `organization_id` (aligned with FH-1.1)

## Reference Documents

- `docs/architecture/system-architecture.md` (Phase 1)
- `docs/architecture/database-audit.md` (Phase 2)
- `docs/architecture/frontend-ux-spec.md` (Phase 3)
- `docs/architecture/consolidated-assessment.md` (Phase 4)
- `docs/architecture/validation-report.md` (Phases 5-7)
- `docs/architecture/executive-report.md` (Phases 8-9)

---

*Created by @po as part of Brownfield Discovery Phase 10*
*Updated 2026-02-14 by @architect — Architectural decisions recorded, FH-1.1 expanded, FH-2.5 added*
