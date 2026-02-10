# Epic: FinHealth Brownfield Remediation

**Epic ID:** FINHEALTH-EPIC-1
**Origin:** Brownfield Discovery Assessment (Phases 1-9)
**Priority:** High
**Status:** Ready for Development
**Created:** 2026-02-08
**Owner:** @po (Pax)

---

## Objective

Address all Critical and High findings identified during the Brownfield Discovery assessment, reducing technical debt from 31 items to <10 and improving the overall health score from 7.2/10 to 8.5+/10.

## Scope

4 sprints covering: security hardening, data integrity, UX improvements, and polish.

## Success Criteria

- [ ] Zero Critical findings remaining
- [ ] Zero High findings remaining
- [ ] RLS policies scoped by user/org on all core tables
- [ ] Client-side form validation on all forms
- [ ] Dead dependencies resolved (integrated or removed)
- [ ] All new code has test coverage
- [ ] Health score >= 8.5/10

## Stories

| Story | Title | Sprint | Points | Status |
|-------|-------|--------|--------|--------|
| FH-1.1 | Scope RLS policies on core business tables | Sprint 1 | 8 | Pending |
| FH-1.2 | Add write RLS policies for reference tables | Sprint 1 | 3 | Pending |
| FH-1.3 | Migrate rate limiting to Upstash Redis | Sprint 1 | 5 | Pending |
| FH-2.1 | Add missing FK constraints and updated_at columns | Sprint 2 | 3 | Pending |
| FH-2.2 | Add missing CHECK constraints on status columns | Sprint 2 | 2 | Pending |
| FH-2.3 | Integrate client-side form validation with react-hook-form + Zod | Sprint 2 | 8 | Pending |
| FH-2.4 | Resolve dead dependencies (SWR adoption or cleanup) | Sprint 2 | 5 | Pending |
| FH-3.1 | Replace notification polling with Supabase Realtime | Sprint 3 | 3 | Pending |
| FH-3.2 | Add per-module React Error Boundaries | Sprint 3 | 3 | Pending |
| FH-3.3 | Dynamic import chart components | Sprint 3 | 2 | Pending |
| FH-3.4 | Responsive card layout for mobile tables | Sprint 3 | 5 | Pending |
| FH-4.1 | WCAG AA contrast audit and fixes | Sprint 4 | 3 | Pending |
| FH-4.2 | Migrate hardcoded strings to next-intl message files | Sprint 4 | 8 | Pending |
| FH-4.3 | Accessibility polish (reduced-motion, badge focus, toast aria) | Sprint 4 | 3 | Pending |
| FH-4.4 | Database schema cleanup (redundant indexes, VARCHAR sizes, duplicate function) | Sprint 4 | 2 | Pending |

**Total Story Points:** 63

## Dependencies

- FH-1.1 requires architectural decision on multi-tenancy model (created_by vs organization_id)
- FH-2.3 requires decision on form library strategy (integrate react-hook-form vs manual Zod)
- FH-2.4 requires decision on data caching strategy (adopt SWR vs remove)
- FH-2.1 requires orphan data cleanup before adding FK constraints

## Reference Documents

- `docs/architecture/system-architecture.md` (Phase 1)
- `docs/architecture/database-audit.md` (Phase 2)
- `docs/architecture/frontend-ux-spec.md` (Phase 3)
- `docs/architecture/consolidated-assessment.md` (Phase 4)
- `docs/architecture/validation-report.md` (Phases 5-7)
- `docs/architecture/executive-report.md` (Phases 8-9)

---

*Created by @po as part of Brownfield Discovery Phase 10*
