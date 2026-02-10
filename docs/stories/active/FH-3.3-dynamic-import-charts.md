# Story FH-3.3: Dynamic import chart components

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 3 — UX & Performance
**Points:** 2
**Priority:** Medium
**Status:** Pending
**Agent:** @dev

---

## Context

Phase 3 finding M-5: Recharts (~40KB gzip) is loaded on every page even when no charts are rendered.

## Acceptance Criteria

- [ ] Wrap all Recharts-based components with `next/dynamic` and `{ ssr: false }`
- [ ] Add loading skeleton for chart areas during dynamic load
- [ ] Verify Recharts not in initial bundle of non-chart pages (e.g., /contas)
- [ ] Charts still render correctly on dashboard and report pages
- [ ] All chart tests pass (may need to adjust for async loading)

## Files to Modify

- `src/components/dashboard/GlosasByReasonChart.tsx` or parent (DYNAMIC IMPORT)
- `src/components/dashboard/PaymentTimelineChart.tsx` or parent (DYNAMIC IMPORT)
- `src/components/dashboard/AccountsStatusChart.tsx` or parent (DYNAMIC IMPORT)
- `src/components/dashboard/MonthlyRevenueChart.tsx` or parent (DYNAMIC IMPORT)
- Report chart components (DYNAMIC IMPORT)

## Definition of Done

- [ ] Bundle analyzer shows Recharts not in common chunk
- [ ] Charts load with skeleton placeholder
- [ ] No visual regression on chart pages
- [ ] All tests pass
