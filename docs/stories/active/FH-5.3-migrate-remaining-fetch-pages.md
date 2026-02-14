# Story FH-5.3: Migrate remaining pages to TanStack Query

**Epic:** FINHEALTH-EPIC-3 (Security & Quality Hardening)
**Sprint:** 5 — Security
**Points:** 3
**Priority:** Medium
**Status:** Done
**Agent:** @dev

---

## Context

FH-2.5 migrated the primary data fetching to TanStack Query, but 3 pages still use raw `fetch + useState + useEffect` patterns. This creates inconsistency and misses TanStack Query benefits (caching, deduplication, automatic refetching).

## Acceptance Criteria

### Page 1: Tendencias (Reports)

- [x] Create `src/hooks/queries/use-trends.ts` — `useTrends(months)` hook
- [x] Replace `fetch + useState + useEffect` in `relatorios/tendencias/page.tsx` with `useTrends`
- [x] Add query key to `src/lib/query-keys.ts`: `trends.data(months)`

### Page 2: Configuracoes (Settings)

- [x] Verify `configuracoes/page.tsx` — already migrated in FH-2.5 (uses `useTissSettings` / `useNotificationPreferences`)
- [x] No remaining `useState + useEffect + fetch` pattern

### Page 3: PatientManagement

- [x] Create `src/hooks/queries/use-patients.ts` — `usePatients` + `useCreatePatient` hooks
- [x] Replace `fetch + useState + useEffect` in `PatientManagement.tsx` with `usePatients`
- [x] Add query key to `src/lib/query-keys.ts`: `patients.all()`, `patients.list(page, search)`
- [x] Add mutation hook `useCreatePatient` with `onSuccess` invalidation

### Consistency

- [x] All hooks use `queryKeys` factory for cache key consistency
- [x] Mutations include `onSuccess` invalidation of related queries
- [x] No remaining `fetch + useState + useEffect` patterns in the codebase

## Files to Create

- `src/hooks/queries/use-trends.ts` (NEW)
- `src/hooks/queries/use-patients.ts` (NEW)

## Files to Modify

- `src/lib/query-keys.ts` — add trends, patients keys
- `src/app/(dashboard)/relatorios/tendencias/page.tsx` — migrate to hook
- `src/app/(dashboard)/configuracoes/page.tsx` — verify/fix
- `src/components/admin/PatientManagement.tsx` — migrate to hook

## Definition of Done

- [x] Zero `fetch + useState + useEffect` patterns remain (grep verification)
- [x] All data fetching uses TanStack Query hooks
- [x] All tests pass (469/469)
- [x] Production build succeeds
