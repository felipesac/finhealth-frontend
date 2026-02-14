# Story FH-5.3: Migrate remaining pages to TanStack Query

**Epic:** FINHEALTH-EPIC-3 (Security & Quality Hardening)
**Sprint:** 5 — Security
**Points:** 3
**Priority:** Medium
**Status:** Ready for Development
**Agent:** @dev

---

## Context

FH-2.5 migrated the primary data fetching to TanStack Query, but 3 pages still use raw `fetch + useState + useEffect` patterns. This creates inconsistency and misses TanStack Query benefits (caching, deduplication, automatic refetching).

## Acceptance Criteria

### Page 1: Tendencias (Reports)

- [ ] Create `src/hooks/queries/use-trends.ts` — `useTrends(period)` hook
- [ ] Replace `fetch + useState + useEffect` in `relatorios/tendencias/page.tsx` with `useTrends`
- [ ] Add query key to `src/lib/query-keys.ts`: `trends.data(orgId, period)`

### Page 2: Configuracoes (Settings)

- [ ] Verify `configuracoes/page.tsx` — if still using raw fetch, migrate to existing `useTissSettings` / `useNotificationPreferences` hooks
- [ ] Remove any remaining `useState + useEffect + fetch` pattern

### Page 3: PatientManagement

- [ ] Create `src/hooks/queries/use-patients.ts` — `usePatients` hook
- [ ] Replace `fetch + useState + useEffect` in `PatientManagement.tsx` with `usePatients`
- [ ] Add query key to `src/lib/query-keys.ts`: `patients.all(orgId)`
- [ ] Add mutation hooks if create/update patterns exist

### Consistency

- [ ] All hooks use `queryKeys` factory for cache key consistency
- [ ] Mutations include `onSuccess` invalidation of related queries
- [ ] No remaining `fetch + useState + useEffect` patterns in the codebase

## Files to Create

- `src/hooks/queries/use-trends.ts` (NEW)
- `src/hooks/queries/use-patients.ts` (NEW)

## Files to Modify

- `src/lib/query-keys.ts` — add trends, patients keys
- `src/app/(dashboard)/relatorios/tendencias/page.tsx` — migrate to hook
- `src/app/(dashboard)/configuracoes/page.tsx` — verify/fix
- `src/components/admin/PatientManagement.tsx` — migrate to hook

## Definition of Done

- [ ] Zero `fetch + useState + useEffect` patterns remain (grep verification)
- [ ] All data fetching uses TanStack Query hooks
- [ ] All tests pass
- [ ] Production build succeeds
