# Story FH-3.2: Add per-module React Error Boundaries

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 3 — UX & Performance
**Points:** 3
**Priority:** Medium
**Status:** Ready for Review
**Agent:** @dev

---

## Context

Phase 3 finding M-2: A single component error (e.g., chart rendering failure) crashes the entire page. No per-section error boundaries exist beyond the route-level `error.tsx` files.

## Acceptance Criteria

- [x] Create `src/components/ui/ErrorBoundary.tsx` — reusable error boundary with retry button
- [x] Wrap chart sections (GlosasChart, PaymentsChart, AccountsStatusChart, GlosasTrendMini) in ErrorBoundary
- [x] Wrap form sections in ErrorBoundary with form-specific error message
- [x] Wrap table components in ErrorBoundary
- [x] Error boundary shows friendly Portuguese message + "Tentar novamente" button
- [x] Errors still reported to Sentry via `componentDidCatch` (uses captureException from error-tracking)
- [x] Add unit tests for ErrorBoundary component (6 tests)

## Files to Modify

- `src/components/ui/ErrorBoundary.tsx` (NEW)
- Dashboard page components (WRAP charts)
- Table list pages (WRAP tables)
- Form pages (WRAP forms)

## File List

| File | Action |
|------|--------|
| `src/components/ui/ErrorBoundary.tsx` | NEW — Reusable class component with retry, PT-BR messages, captureException |
| `src/components/ui/ErrorBoundary.test.tsx` | NEW — 6 unit tests |
| `src/app/(dashboard)/dashboard/page.tsx` | Modified — wrapped metrics, charts, glosas-chart, recent-accounts widgets |
| `src/app/(dashboard)/glosas/page.tsx` | Modified — wrapped GlosasTable |
| `src/app/(dashboard)/contas/page.tsx` | Modified — wrapped AccountsTable |
| `src/app/(dashboard)/pagamentos/page.tsx` | Modified — wrapped PaymentsTable |
| `src/app/(dashboard)/contas/nova/page.tsx` | Modified — wrapped CreateAccountForm |
| `src/app/(dashboard)/glosas/[id]/page.tsx` | Modified — wrapped AppealForm |

## Definition of Done

- [x] Chart error does NOT crash entire page
- [x] User sees retry button on component failure
- [x] Sentry captures the error (via captureException)
- [x] All tests pass (445/445)

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Change Log
- Created ErrorBoundary class component with getDerivedStateFromError + componentDidCatch
- Uses captureException from error-tracking lib (Sentry-ready)
- Fallback UI: AlertTriangle icon, PT-BR message, "Tentar novamente" button
- Supports custom fallbackMessage prop for context-specific messages
- Wrapped 4 dashboard widget sections (metrics, charts, glosas-chart, recent-accounts)
- Wrapped 3 table pages (glosas, contas, pagamentos)
- Wrapped 2 form pages (nova conta, recurso de glosa)
