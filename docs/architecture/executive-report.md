# Executive Report — FinHealth Brownfield Discovery

**Project:** FinHealth - Sistema de Gestao Financeira de Saude
**Phase:** Brownfield Discovery - Phases 8-9 (Final Assessment + Executive Report)
**Date:** 2026-02-08
**Agent:** @architect (Aria)
**Validation:** QA Gate PASSED — All findings verified against source code

---

## 1. Project Profile

| Attribute | Value |
|-----------|-------|
| Type | Full-stack Next.js 14 web application |
| Domain | Healthcare financial management (Brazil) |
| Production | https://finhealth.com.br (Vercel) |
| Codebase Size | 66 pages, 32+ API routes, 69 test files |
| Database | PostgreSQL 17 (Supabase), 14 tables, 52 indexes |
| Stack | React 18, TypeScript 5, Tailwind CSS, Supabase, Zod |
| Test Coverage | 384 unit/component tests + 6 E2E specs |
| Status | Production-deployed, active |

---

## 2. Health Score

**Overall: 7.2 / 10**

```
Architecture    ████████░░  8.0/10  Clean patterns, well-separated concerns
Testing         ███████▌░░  7.5/10  Good coverage, pre-commit hooks
DX              ████████░░  8.0/10  Husky, lint-staged, Sentry, consistent patterns
Frontend/UX     ███████▌░░  7.5/10  Strong design system, missing client validation
Performance     ███████░░░  7.0/10  Server Components, but no data caching
Security        ██████▌░░░  6.5/10  Strong API controls, weak DB-level enforcement
Database        ██████░░░░  6.0/10  Good schema, but RLS gaps create risk
```

---

## 3. Top Strengths

| # | Strength | Evidence |
|---|----------|----------|
| 1 | **Consistent API pattern** | All 32+ routes follow: rate-limit → RBAC → Zod → Supabase → audit log |
| 2 | **Comprehensive audit trail** | Fire-and-forget logging with action, resource, details, IP on every write |
| 3 | **Design system maturity** | HSL CSS variables, shadcn/ui with CVA variants, light/dark theme, print styles |
| 4 | **Accessibility foundation** | Skip link, ARIA landmarks, keyboard shortcuts (7), semantic HTML throughout |
| 5 | **Brazilian healthcare domain model** | TISS, SUS, TUSS, SIGTAP, CBHPM properly modeled with domain validators (CPF, CNPJ, CNES, CBO, ANS) |
| 6 | **Security headers** | CSP, HSTS, X-Frame-Options, CSRF protection, noindex/nofollow |
| 7 | **Test infrastructure** | Vitest + Testing Library + Playwright, pre-commit quality gates |

---

## 4. Critical Findings (Require Immediate Attention)

### 4.1 Database-Level Access Control Gap

**Risk: HIGH** | **Effort: 3-5 days**

The 4 core business tables (`medical_accounts`, `procedures`, `glosas`, `payments`) have RLS policies that allow **any authenticated user full CRUD access** to **all records**:

```sql
-- Actual policy on all 4 tables:
CREATE POLICY "Authenticated write" ON medical_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

RBAC is enforced only at the API level via `checkPermission()`. If any API route has a bug, or if a user accesses Supabase directly via the public anon key, they can read/modify any record.

**Recommendation:** Add `created_by UUID` column to core tables and scope RLS policies by `auth.uid()`.

### 4.2 No Client-Side Form Validation

**Risk: MEDIUM** | **Effort: 3-4 days**

All 8+ form components use raw `useState` per field with no client-side validation. Errors are only shown after a server round-trip. Zod schemas exist server-side and could be reused.

**Note:** `react-hook-form` and `@hookform/resolvers` are installed as dependencies but are **dead code** — never imported by any component. A shadcn `form.tsx` wrapper exists but is unused.

**Recommendation:** Either integrate react-hook-form + Zod resolvers properly, or remove the dead dependencies and add manual `Zod.safeParse()` on submit.

### 4.3 No Data Caching Strategy

**Risk: MEDIUM** | **Effort: 2-3 days**

No client-side data caching despite `swr@2.4.0` being installed (also dead code — zero imports). Every client navigation refetches from server. Notifications use 60-second polling instead of Supabase Realtime (which is already configured for the dashboard).

**Recommendation:** Adopt SWR for client fetching with stale-while-revalidate, or remove the dependency and rely on Next.js server-side caching.

### 4.4 Rate Limiting Ineffective on Vercel

**Risk: MEDIUM** | **Effort: 2-3 days**

In-memory rate limiter uses a JavaScript `Map` that resets on every serverless cold start. On Vercel with multiple instances, rate limits are per-instance and ephemeral.

**Recommendation:** Migrate to Upstash Redis (Vercel-native) or Vercel KV for distributed rate limiting.

---

## 5. Technical Debt Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | 2 | 1 | 0 | 0 | 3 |
| Database | 0 | 3 | 3 | 7 | 13 |
| Frontend/UX | 2 | 1 | 5 | 7 | 15 |
| **Total** | **4** | **5** | **8** | **14** | **31** |

### Dead Dependencies (Bundle Impact)

| Package | Version | Size | Status |
|---------|---------|------|--------|
| `react-hook-form` | 7.71.1 | ~33KB gzip | Installed, never used |
| `@hookform/resolvers` | 5.2.2 | ~8KB gzip | Installed, never used |
| `swr` | 2.4.0 | ~12KB gzip | Installed, never used |
| **Total waste** | | **~53KB gzip** | Tree-shaking may eliminate, but adds install time |

---

## 6. Prioritized Roadmap

### Immediate (Sprint 1) — Security Hardening

| Action | Effort | Impact |
|--------|--------|--------|
| Scope RLS policies on 4 core tables by `auth.uid()` or org_id | 3-5 days | Closes critical data access gap |
| Add write RLS policies for patients/health_insurers | 1 day | Enables proper write operations |
| Evaluate Upstash Redis for rate limiting | 2-3 days | Distributed rate limiting on Vercel |

### Short-term (Sprint 2) — Data Quality + UX

| Action | Effort | Impact |
|--------|--------|--------|
| Add missing FK constraints (4 user_id columns → auth.users) | 1 day | Referential integrity |
| Add `updated_at` to procedures and payments tables | 0.5 day | Audit trail completeness |
| Add missing CHECK constraints (3 status columns) | 0.5 day | Data validity |
| Integrate client-side Zod validation on forms | 3-4 days | Immediate UX improvement |
| Adopt SWR or remove dead dependencies | 2-3 days | Performance or cleanup |

### Medium-term (Sprint 3) — UX Polish

| Action | Effort | Impact |
|--------|--------|--------|
| Replace notification polling with Supabase Realtime | 1 day | Real-time UX, less network |
| Add per-module React Error Boundaries | 1-2 days | Fault isolation |
| Dynamic import Recharts components | 1 day | -40KB on non-chart pages |
| Responsive card layout for mobile tables | 3-4 days | Mobile usability |

### Long-term (Sprint 4) — Compliance + Polish

| Action | Effort | Impact |
|--------|--------|--------|
| WCAG AA contrast audit | 1-2 days | Accessibility compliance |
| Migrate hardcoded Portuguese to next-intl messages | 5-7 days | i18n readiness |
| `prefers-reduced-motion` support | 0.5 day | Motion accessibility |
| DB cosmetics (redundant indexes, VARCHAR sizes) | 0.5 day | Schema hygiene |

**Total estimated effort: 30-40 days across 4 sprints**

---

## 7. Architecture Decision Points

These decisions should be made before starting Sprint 1:

### Decision 1: Multi-tenancy Model

**Context:** RLS hardening requires scoping data. Two approaches:

| Option | Approach | Effort | Future-proof |
|--------|----------|--------|-------------|
| A (Simple) | Add `created_by UUID` to core tables, scope by `auth.uid()` | 3 days | Single-org only |
| B (Scalable) | Add `organization_id UUID` + org table, scope by org membership | 5 days | Multi-tenant ready |

**Recommendation:** Option A for now unless multi-tenancy is planned within 6 months.

### Decision 2: Form Library Strategy

| Option | Approach | Bundle Impact |
|--------|----------|--------------|
| A (Integrate) | Wire up existing react-hook-form + Zod resolvers | +0KB (already installed) |
| B (Remove) | Delete dead deps, add manual Zod.safeParse() on submit | -53KB gzip |
| C (Replace) | Remove react-hook-form, add TanStack Form (lighter) | Net ~-20KB |

**Recommendation:** Option A — the libraries are already installed, shadcn form.tsx wrapper exists, and react-hook-form is the standard for this stack.

### Decision 3: Data Caching Strategy

| Option | Approach | Network Impact |
|--------|----------|---------------|
| A (SWR) | Adopt installed SWR with stale-while-revalidate | -60% redundant fetches |
| B (TanStack Query) | Replace SWR with TanStack Query (more features) | -60% + devtools |
| C (Server only) | Remove SWR, rely on Next.js `fetch()` cache + revalidation | -0KB client, server-side |

**Recommendation:** Option A — SWR is already installed and is simpler for this use case.

---

## 8. Risk Matrix

```
Impact
  ▲
  │  ┌─────────────────────────────────────────┐
H │  │ SEC-1: RLS gap      SEC-3: Rate limit   │
  │  │ (Critical)          (High)               │
  │  ├─────────────────────────────────────────┤
M │  │ UX-1: No client     PERF-1: No caching  │
  │  │ validation          DB-1: Missing FKs    │
  │  ├─────────────────────────────────────────┤
L │  │ UX-4: i18n debt     DB cosmetics        │
  │  │ UX-11: Contrast     UX-12: Motion       │
  │  └─────────────────────────────────────────┘
  └──────────────────────────────────────────▶
       Low              Medium            High
                    Probability
```

---

## 9. Deliverables Produced

| # | Document | Phase | Lines | Status |
|---|----------|-------|-------|--------|
| 1 | `docs/architecture/system-architecture.md` | Phase 1 | ~700 | Verified |
| 2 | `docs/architecture/database-audit.md` | Phase 2 | ~730 | Verified |
| 3 | `docs/architecture/frontend-ux-spec.md` | Phase 3 | ~780 | Verified |
| 4 | `docs/architecture/consolidated-assessment.md` | Phase 4 | ~350 | Verified |
| 5 | `docs/architecture/validation-report.md` | Phases 5-7 | ~250 | QA Passed |
| 6 | `docs/architecture/executive-report.md` | Phases 8-9 | This doc | Final |

---

## 10. Conclusion

FinHealth is a **production-quality application** with strong architectural patterns, comprehensive domain modeling, and good test coverage. The primary risk is the **security gap between API-level RBAC and database-level RLS**, which should be addressed immediately. Secondary improvements (client validation, data caching, dead dependency cleanup) will significantly improve UX and developer experience with moderate effort.

The codebase is well-positioned for iterative improvement. The consistent patterns (API routes, component architecture, design system) make it straightforward to address findings systematically across the 4-sprint roadmap.

**Estimated total investment:** 30-40 developer-days across 4 sprints
**Expected impact:** Security hardening + 20-30% UX improvement + reduced technical debt

---

*FinHealth Brownfield Discovery — Complete*
*Phases 1-9 executed by: @architect, @data-engineer, @ux-design-expert, @dev, @qa*
*Next: Phase 10 — Epic + Stories Creation (@pm/@po)*
