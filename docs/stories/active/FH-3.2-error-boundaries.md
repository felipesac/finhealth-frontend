# Story FH-3.2: Add per-module React Error Boundaries

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 3 — UX & Performance
**Points:** 3
**Priority:** Medium
**Status:** Pending
**Agent:** @dev

---

## Context

Phase 3 finding M-2: A single component error (e.g., chart rendering failure) crashes the entire page. No per-section error boundaries exist beyond the route-level `error.tsx` files.

## Acceptance Criteria

- [ ] Create `src/components/ui/ErrorBoundary.tsx` — reusable error boundary with retry button
- [ ] Wrap chart sections (GlosasByReasonChart, PaymentTimelineChart, etc.) in ErrorBoundary
- [ ] Wrap form sections in ErrorBoundary with form-specific error message
- [ ] Wrap table components in ErrorBoundary
- [ ] Error boundary shows friendly Portuguese message + "Tentar novamente" button
- [ ] Errors still reported to Sentry via `componentDidCatch`
- [ ] Add unit tests for ErrorBoundary component

## Files to Modify

- `src/components/ui/ErrorBoundary.tsx` (NEW)
- Dashboard page components (WRAP charts)
- Table list pages (WRAP tables)
- Form pages (WRAP forms)

## Definition of Done

- [ ] Chart error does NOT crash entire page
- [ ] User sees retry button on component failure
- [ ] Sentry captures the error
- [ ] All tests pass
