# Consolidated Technical Assessment

**Project:** FinHealth - Sistema de Gestao Financeira de Saude
**Phase:** Brownfield Discovery - Phase 4 (Consolidation)
**Date:** 2026-02-08
**Agent:** @architect (Aria)

---

## 1. Executive Summary

FinHealth is a production-deployed Next.js 14 healthcare financial management system serving Brazilian hospitals and clinics. The application covers medical accounts, insurance claims (TISS/SUS), payment reconciliation, glosa management, and compliance reporting across 66 pages and 32+ API endpoints.

**Overall Health Score: 7.2 / 10**

| Dimension | Score | Key Factor |
|-----------|-------|------------|
| Architecture | 8/10 | Clean App Router patterns, well-separated concerns |
| Database | 6/10 | Good schema design, but RLS gaps create security risk |
| Frontend/UX | 7.5/10 | Solid design system + accessibility, missing client validation |
| Security | 6.5/10 | Strong API-level controls, weak database-level enforcement |
| Performance | 7/10 | Server Components, dynamic imports, but no data caching |
| Testing | 7.5/10 | 384 tests + 6 E2E specs, good coverage patterns |
| DX | 8/10 | Pre-commit hooks, lint-staged, Sentry, consistent patterns |

---

## 2. Cross-Reference Analysis

### 2.1 Security Layer Gap (DB + Architecture)

The most significant cross-cutting finding spans Phase 1 (Architecture) and Phase 2 (Database):

```
API Level:  RBAC via checkPermission() → 4 roles, 19 permissions ✅
DB Level:   RLS on core tables → "FOR ALL authenticated" ⚠️
```

**Impact:** If any API route has a RBAC bypass bug, or if a user accesses Supabase directly via the anon key, ALL authenticated users can read/modify ANY record in `medical_accounts`, `procedures`, `glosas`, and `payments`.

**Cross-reference:**
- Phase 1 (S7 - RBAC): Roles enforced at API level via `checkPermission()`
- Phase 2 (C1): RLS allows any authenticated user full CRUD on 4 core tables
- Phase 3 (S9.1): Forms submit to API routes (correct), but no fallback if API bypassed

**Recommendation:** Implement user-scoped or organization-scoped RLS policies. This requires adding an `organization_id` or `user_id` column to core tables and writing RLS policies that scope by `auth.uid()`.

### 2.2 Validation Consistency Gap (DB + Frontend + API)

```
Frontend:  No client-side Zod validation (useState per field, no schema check) ⚠️
API:       Zod schema validation on every route ✅
Database:  CHECK constraints on status/type enums ✅
           No CHECK on procedures.status, sus_bpa.status, sus_aih.status ⚠️
```

**Cross-reference:**
- Phase 1 (S4.3): API routes validate with Zod before Supabase query
- Phase 2 (L6, L7): `procedures.status` and SUS status columns lack CHECK constraints
- Phase 3 (C-1): No client-side form validation; errors shown only after server round-trip
- Phase 1 (S2): `react-hook-form` and `@hookform/resolvers` are installed but not used in form components

**Recommendation:**
1. Add client-side Zod validation using the existing schemas (they're already shared)
2. Migrate forms to `react-hook-form` + `@hookform/resolvers/zod` (already installed as dependencies)
3. Add missing CHECK constraints to `procedures.status`, `sus_bpa.status`, `sus_aih.status`

### 2.3 Data Freshness Strategy (Architecture + Frontend)

```
Server Components:  Direct Supabase queries (fresh on navigation) ✅
Client Components:  No SWR/TanStack Query (refetch on every render) ⚠️
Notifications:      60s polling interval ⚠️
Dashboard:          Supabase Realtime subscription ✅
```

**Cross-reference:**
- Phase 1 (S2): `SWR 2.4.x` is in package.json but not used in analyzed components
- Phase 1 (S4.5): State management section mentions SWR for client fetching
- Phase 3 (C-2): No data caching identified
- Phase 3 (M-1): Notification polling instead of Realtime

**Recommendation:** Adopt SWR (already installed) for client-side data fetching with stale-while-revalidate. Migrate notification polling to Supabase Realtime channel.

### 2.4 Referential Integrity Gaps (DB + Architecture)

```
Missing FKs:  notifications.user_id → auth.users ⚠️
              digital_certificates.user_id → auth.users ⚠️
              sus_bpa.user_id → auth.users ⚠️
              sus_aih.user_id → auth.users ⚠️
              patients.health_insurance_id → health_insurers ⚠️
```

**Cross-reference:**
- Phase 2 (M1, M2): Multiple `user_id` columns lack FK to `auth.users`
- Phase 1 (S7.5): Audit log correctly FKs to `auth.users`
- Phase 2 (M4): `glosas.procedure_id` FK lacks CASCADE

**Impact:** Orphaned records possible if users are deleted from Supabase Auth. Patient-insurer relationship not enforced at DB level. Procedure deletion can cause FK violations with glosas.

### 2.5 i18n Incomplete Migration (Frontend + Architecture)

```
Infrastructure:  next-intl configured with pt-BR.json and en.json ✅
Components:      Hardcoded Portuguese strings throughout ⚠️
Breadcrumbs:     30 hardcoded Portuguese segment labels ⚠️
Forms:           All labels hardcoded in Portuguese ⚠️
```

**Cross-reference:**
- Phase 1 (S2): `next-intl 4.8.x` installed
- Phase 1 (ADR-6): Portuguese-first with i18n infrastructure for expansion
- Phase 3 (M-3): Most strings hardcoded, not using message files

**Impact:** English locale exists but most UI would still display Portuguese.

---

## 3. Unified Findings Registry

All findings from 3 phases, deduplicated and cross-referenced:

### 3.1 Critical (Immediate Action Required)

| ID | Finding | Source | Impact | Effort |
|----|---------|--------|--------|--------|
| **SEC-1** | RLS on core tables allows any authenticated user full CRUD | DB C1 | Data breach if API bypassed | High |
| **SEC-2** | `patients` and `health_insurers` have no write policies for authenticated role | DB C2 | Writes may silently fail or require elevated privileges | Medium |
| **UX-1** | No client-side form validation despite Zod schemas + react-hook-form available | UX C-1 | Poor UX: errors only after server round-trip | Medium |
| **PERF-1** | No data caching strategy despite SWR installed | UX C-2 | Unnecessary refetches, no optimistic updates | Medium |

### 3.2 High (Plan for Next Sprint)

| ID | Finding | Source | Impact | Effort |
|----|---------|--------|--------|--------|
| **SEC-3** | In-memory rate limiting resets on serverless cold start | Arch ADR-3 | Rate limits ineffective on Vercel (multiple instances) | Medium |
| **DB-1** | 4 `user_id` columns not FK'd to `auth.users` | DB M1 | Orphaned records, no referential integrity | Low |
| **DB-2** | `patients.health_insurance_id` is TEXT, not FK | DB M2 | Broken patient-insurer relationships | Low |
| **DB-3** | `procedures` and `payments` lack `updated_at` | DB M3 | Cannot audit when records last changed | Low |
| **UX-2** | Notification polling instead of Realtime | UX M-1 | 60s delay, wasteful polling | Medium |

### 3.3 Medium (Backlog)

| ID | Finding | Source | Impact | Effort |
|----|---------|--------|--------|--------|
| **DB-4** | `glosas.procedure_id` FK lacks CASCADE | DB M4 | FK violations on procedure deletion | Low |
| **DB-5** | SUS BPA/AIH lack DELETE RLS policies | DB M5 | Cannot delete via user role | Low |
| **DB-6** | Duplicate `update_tuss_updated_at()` function | DB M6 | Code duplication | Trivial |
| **UX-3** | No per-module error boundaries | UX M-2 | Single component error crashes entire page | Medium |
| **UX-4** | Hardcoded Portuguese vs i18n message files | UX M-3 | Incomplete i18n, inconsistent pattern | High |
| **UX-5** | Missing loading.tsx for some sub-routes | UX M-4 | No loading feedback on some navigations | Low |
| **UX-6** | Recharts bundle always loaded | UX M-5 | +40KB gzip on non-chart pages | Low |
| **UX-7** | No responsive table solution for mobile | UX M-6 | Poor mobile experience with wide tables | Medium |

### 3.4 Low (Opportunistic)

| ID | Finding | Source | Impact | Effort |
|----|---------|--------|--------|--------|
| **DB-7** | `tuss_procedures.unit_price` DECIMAL(10,2) inconsistent | DB L1 | Cosmetic, max R$99M vs R$9.9B | Trivial |
| **DB-8** | Mix of DECIMAL/NUMERIC keywords | DB L2 | Cosmetic inconsistency | Trivial |
| **DB-9** | Redundant UNIQUE + B-tree on `tuss_procedures.code` | DB L3 | Wasted storage/write overhead | Trivial |
| **DB-10** | `ans_code` VARCHAR(20) oversized for 6-digit code | DB L4 | Cosmetic | Trivial |
| **DB-11** | Missing composite index `(status, created_at)` | DB L5 | Suboptimal query for common list pattern | Trivial |
| **DB-12** | `procedures.status` lacks CHECK constraint | DB L6 | Accepts invalid values | Trivial |
| **DB-13** | SUS status columns lack CHECK constraints | DB L7 | Accepts invalid values | Trivial |
| **UX-8** | Sidebar width jump on hydration | UX L-1 | Brief layout shift | Low |
| **UX-9** | No focus-visible on Badge | UX L-2 | A11y gap for interactive badges | Trivial |
| **UX-10** | MobileBottomNav shows 5/8 sections | UX L-3 | 3 sections inaccessible from bottom nav | Low |
| **UX-11** | No color contrast validation (WCAG AA) | UX L-4 | Potential a11y violation | Medium |
| **UX-12** | No `prefers-reduced-motion` support | UX L-5 | A11y gap for motion-sensitive users | Low |
| **UX-13** | Print styles don't handle chart SVGs | UX L-6 | Charts may render poorly in print | Low |
| **UX-14** | Toast aria-live verification needed | UX L-7 | Screen reader may miss toasts | Low |

---

## 4. Architecture Strengths

These are well-implemented patterns that should be preserved and extended:

| Pattern | Quality | Location |
|---------|---------|----------|
| **API route consistency** | Every route follows: rate-limit → RBAC → Zod → query → audit | All 32+ routes |
| **Audit trail** | Fire-and-forget logging with IP, action, resource, details | `src/lib/audit-logger.ts` |
| **Component architecture** | shadcn/ui pattern with CVA variants, consistent composition | `src/components/ui/` |
| **Design token system** | HSL CSS variables enabling seamless light/dark theming | `globals.css` + `tailwind.config.ts` |
| **Route organization** | Clean `(auth)` / `(dashboard)` route groups with dedicated layouts | `src/app/` |
| **Security headers** | CSP, HSTS, X-Frame-Options, CSRF protection | `next.config.mjs` + `middleware.ts` |
| **Brazilian domain model** | TISS, SUS, TUSS, SIGTAP, CBHPM properly modeled | Types, validators, API routes |
| **Loading states** | Skeleton placeholders per route segment | `loading.tsx` files |
| **Accessibility foundation** | Skip link, ARIA labels, keyboard shortcuts, semantic HTML | Layout components |
| **Pre-commit quality** | ESLint + affected Vitest on staged files | Husky + lint-staged |

---

## 5. Technical Debt Inventory

| Category | Items | Priority |
|----------|-------|----------|
| **Security** | RLS gaps (2 critical), rate-limit cold-start (1 high) | Immediate |
| **Data Integrity** | Missing FKs (5), missing CASCADE (1), missing CHECKs (3) | Next sprint |
| **UX Gaps** | No client validation (1), no caching (1), no error boundaries (1) | Next sprint |
| **Unused Dependencies** | react-hook-form installed but not used, SWR installed but not used | Backlog |
| **i18n Debt** | ~200+ hardcoded Portuguese strings across components | Backlog |
| **Performance** | Chart bundle loading, notification polling, no responsive tables | Backlog |
| **Accessibility** | Contrast audit, reduced-motion, badge focus, toast aria-live | Backlog |

---

## 6. Prioritized Action Plan

### Sprint 1: Security Hardening (Critical)

| # | Action | Files | Effort | Blocks |
|---|--------|-------|--------|--------|
| 1 | Add user/org-scoped RLS to `medical_accounts`, `procedures`, `glosas`, `payments` | New migration | 3-5 days | May require adding `created_by` column |
| 2 | Add write policies for `patients`, `health_insurers` | New migration | 1 day | - |
| 3 | Evaluate Redis/Upstash for rate limiting on Vercel | `src/lib/rate-limit.ts` | 2-3 days | Env var for Redis URL |

### Sprint 2: Data Integrity & Validation (High)

| # | Action | Files | Effort | Blocks |
|---|--------|-------|--------|--------|
| 4 | Add missing FK constraints (user_id → auth.users) | New migration | 1 day | Must clean orphaned records first |
| 5 | Add `updated_at` to `procedures` and `payments` | New migration | 0.5 day | - |
| 6 | Add CHECK constraints to `procedures.status`, `sus_bpa.status`, `sus_aih.status` | New migration | 0.5 day | - |
| 7 | Migrate forms to react-hook-form + Zod client validation | Form components (~8 files) | 3-4 days | - |
| 8 | Adopt SWR for client-side data fetching | Hooks + components | 2-3 days | - |

### Sprint 3: UX & Performance (Medium)

| # | Action | Files | Effort | Blocks |
|---|--------|-------|--------|--------|
| 9 | Replace notification polling with Supabase Realtime | NotificationDropdown | 1 day | - |
| 10 | Add React Error Boundaries per module | Layout components | 1-2 days | - |
| 11 | Dynamic import Recharts components | Chart components | 1 day | - |
| 12 | Add responsive card view for mobile tables | Table components | 3-4 days | - |
| 13 | Ensure all route leaves have loading.tsx | Route files | 1 day | - |

### Sprint 4: Polish & Compliance (Low)

| # | Action | Files | Effort | Blocks |
|---|--------|-------|--------|--------|
| 14 | WCAG AA contrast audit + fixes | CSS variables | 1-2 days | - |
| 15 | Add `prefers-reduced-motion` support | Tailwind classes | 0.5 day | - |
| 16 | Migrate hardcoded strings to next-intl messages | All components | 5-7 days | - |
| 17 | Add `patients.health_insurance_id` FK + CASCADE fixes | Migration | 0.5 day | - |
| 18 | Clean up DB cosmetics (redundant indexes, VARCHAR sizes) | Migration | 0.5 day | - |

---

## 7. Dependency Graph

```
SEC-1 (RLS hardening)
  └── Requires: schema migration to add created_by/org_id
  └── Blocks: Nothing (can be done independently)

UX-1 (Client validation)
  └── Requires: react-hook-form already installed
  └── Depends on: Existing Zod schemas in validations.ts
  └── Blocks: Better UX for all forms

PERF-1 (Data caching)
  └── Requires: SWR already installed
  └── Blocks: Optimistic updates, stale-while-revalidate

UX-2 (Realtime notifications)
  └── Requires: Supabase Realtime already configured
  └── Depends on: useRealtimeSubscription hook exists
  └── Blocks: Better notification UX

DB-1..DB-6 (Integrity fixes)
  └── All independent migrations
  └── DB-1 requires orphan cleanup first
```

---

## 8. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| RLS bypass via direct Supabase access | Medium | Critical (data breach) | Sprint 1 action #1 |
| Rate limiter reset on cold start | High (Vercel) | Medium (abuse) | Sprint 1 action #3 |
| Orphaned records from user deletion | Low | Medium (data quality) | Sprint 2 action #4 |
| Form submission with invalid data | Low (API validates) | Low (UX friction) | Sprint 2 action #7 |
| Mobile users struggling with tables | Medium | Medium (usability) | Sprint 3 action #12 |
| i18n inconsistency if English added | Low (not planned) | Low | Sprint 4 action #16 |

---

## 9. Source Documents

| Phase | Document | Agent | Date |
|-------|----------|-------|------|
| Phase 1 | `docs/architecture/system-architecture.md` | @architect | 2026-02-08 |
| Phase 2 | `docs/architecture/database-audit.md` | @data-engineer | 2026-02-08 |
| Phase 3 | `docs/architecture/frontend-ux-spec.md` | @ux-design-expert | 2026-02-08 |
| Phase 4 | `docs/architecture/consolidated-assessment.md` (this doc) | @architect | 2026-02-08 |

---

## 10. Conclusion

FinHealth is a well-architected production application with strong patterns in API design, component architecture, and security headers. The primary risk area is the **gap between API-level RBAC and database-level RLS**, which creates a defense-in-depth weakness. The secondary concerns are **unused installed dependencies** (react-hook-form, SWR) that could immediately solve identified UX gaps if adopted.

The 4-sprint action plan addresses findings in order of risk:
1. **Security** - Close the RLS gap and fix rate limiting
2. **Data Integrity** - Add missing constraints and adopt client validation
3. **UX/Performance** - Realtime notifications, error boundaries, responsive tables
4. **Polish** - Accessibility audit, i18n completion, cosmetic DB fixes

Total estimated effort: **~30-40 days** across all 4 sprints.

---

*Generated by @architect as part of AIOS Brownfield Discovery Phase 4 - Consolidation*
*Next: Phase 5-7 - Specialist Validation + QA Gate*
