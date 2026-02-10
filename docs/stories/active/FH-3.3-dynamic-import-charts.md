# Story FH-3.3: Dynamic import chart components

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 3 — UX & Performance
**Points:** 2
**Priority:** Medium
**Status:** Ready for Review
**Agent:** @dev

---

## Context

Phase 3 finding M-5: Recharts (~40KB gzip) is loaded on every page even when no charts are rendered.

## Acceptance Criteria

- [x] Wrap all Recharts-based components with `next/dynamic` and `{ ssr: false }`
- [x] Add loading skeleton for chart areas during dynamic load
- [x] Verify Recharts not in initial bundle of non-chart pages (e.g., /contas)
- [x] Charts still render correctly on dashboard and report pages
- [x] All chart tests pass (may need to adjust for async loading)

## Files to Modify

- `src/components/dashboard/GlosasChart.tsx` or parent (DYNAMIC IMPORT)
- `src/components/dashboard/PaymentsChart.tsx` or parent (DYNAMIC IMPORT)
- `src/components/dashboard/AccountsStatusChart.tsx` or parent (DYNAMIC IMPORT)
- `src/components/dashboard/GlosasTrendMini.tsx` or parent (DYNAMIC IMPORT)
- Report chart components (DYNAMIC IMPORT)

## File List

| File | Action |
|------|--------|
| `src/components/ui/ChartSkeleton.tsx` | NEW — Loading skeleton for chart areas |
| `src/components/reports/TendenciasCharts.tsx` | NEW — Extracted recharts from tendencias page |
| `src/app/(dashboard)/dashboard/page.tsx` | Modified — 4 chart components use `next/dynamic` with `ssr: false` |
| `src/app/(dashboard)/relatorios/tendencias/page.tsx` | Modified — charts extracted to TendenciasCharts, loaded via `next/dynamic` |

## Definition of Done

- [x] Bundle analyzer shows Recharts not in common chunk (dynamic imports isolate recharts to chart-only chunks)
- [x] Charts load with skeleton placeholder (ChartSkeleton component)
- [x] No visual regression on chart pages
- [x] All tests pass (445/445)

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Change Log
- Created ChartSkeleton component using existing Skeleton + Card UI
- Dashboard page: replaced 4 static chart imports with `next/dynamic({ ssr: false })`
- Each dynamic chart shows ChartSkeleton while loading
- Tendencias page: extracted inline recharts into TendenciasCharts component, dynamically imported
- Recharts (~40KB gzip) now only loads when chart components are actually rendered
- All existing chart tests continue to pass (they import directly from component files)
