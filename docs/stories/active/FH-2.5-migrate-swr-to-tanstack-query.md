# Story FH-2.5: Migrate data fetching from SWR to TanStack Query

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 2 — Data Quality + UX
**Points:** 5
**Priority:** High
**Status:** Ready for Development
**Agent:** @dev
**Quality Gate:** @architect

---

## Context

### Architectural Decision (2026-02-14)

**Decision: TanStack Query over SWR (Option B)**

FinHealth is being built as a multi-tenant SaaS platform serving hospitals, UBS, and clinics. The data caching layer needs:
- Cache scoped by `organizationId` (tenant isolation in cache keys)
- Automatic invalidation when another user in the same org modifies data
- DevTools for debugging cache behavior across tenants
- Optimistic updates for mutations (billing, glosas, payments)
- Infinite queries for large lists (medical accounts, procedures)

TanStack Query provides all of these out of the box. SWR is currently installed but is dead code (zero imports).

### Relation to FH-2.4

FH-2.4 (Done) resolved dead dependencies by removing unused SWR. This story adds TanStack Query as the strategic replacement with proper multi-tenant patterns.

## Acceptance Criteria

### Phase 1: Setup

- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [ ] Remove `swr` from dependencies (if not already removed in FH-2.4)
- [ ] Create `QueryProvider` wrapper in `src/providers/query-provider.tsx`
- [ ] Add `QueryProvider` to app layout
- [ ] Configure default options (staleTime, gcTime, retry)

### Phase 2: Query Key Strategy

- [ ] Define query key factory in `src/lib/query-keys.ts`:
  ```typescript
  export const queryKeys = {
    accounts: {
      all: (orgId: string) => ['accounts', orgId] as const,
      list: (orgId: string, filters: AccountFilters) => ['accounts', orgId, 'list', filters] as const,
      detail: (orgId: string, id: string) => ['accounts', orgId, 'detail', id] as const,
    },
    glosas: {
      all: (orgId: string) => ['glosas', orgId] as const,
      // ... same pattern
    },
    payments: { /* ... */ },
    dashboard: {
      metrics: (orgId: string) => ['dashboard', orgId, 'metrics'] as const,
    },
  };
  ```
- [ ] All query keys include `organizationId` for tenant-scoped cache

### Phase 3: Custom Hooks

- [ ] Create `src/hooks/queries/use-accounts.ts` — replaces direct fetch calls
- [ ] Create `src/hooks/queries/use-glosas.ts`
- [ ] Create `src/hooks/queries/use-payments.ts`
- [ ] Create `src/hooks/queries/use-dashboard.ts`
- [ ] Each hook uses `queryKeys` factory for cache key consistency
- [ ] Mutations include `onSuccess` invalidation of related queries

### Phase 4: Migration

- [ ] Replace all `fetch()` + `useState` + `useEffect` data loading patterns with TanStack Query hooks
- [ ] Dashboard page uses `useDashboardMetrics()` hook
- [ ] List pages use infinite queries where appropriate
- [ ] Detail pages use single-resource queries with prefetching

### Phase 5: DevTools & Quality

- [ ] ReactQueryDevtools visible in development only
- [ ] All existing tests pass (mock TanStack Query in tests)
- [ ] No duplicate fetching on navigation (verify with DevTools)
- [ ] Stale data shows immediately while revalidating (UX improvement)

## Technical Notes

- Default `staleTime: 30_000` (30s) for most queries, `staleTime: 60_000` (1min) for dashboard metrics
- `gcTime: 300_000` (5min) garbage collection
- Retry: 1 attempt for mutations, 3 for queries
- `refetchOnWindowFocus: true` for real-time feel
- Prefetch dashboard data in layout for instant page loads

## Files to Create/Modify

- `src/providers/query-provider.tsx` (NEW)
- `src/lib/query-keys.ts` (NEW)
- `src/hooks/queries/use-accounts.ts` (NEW)
- `src/hooks/queries/use-glosas.ts` (NEW)
- `src/hooks/queries/use-payments.ts` (NEW)
- `src/hooks/queries/use-dashboard.ts` (NEW)
- `src/app/(dashboard)/layout.tsx` (ADD QueryProvider)
- `package.json` (ADD @tanstack/react-query, @tanstack/react-query-devtools)
- Pages that currently use direct fetch + useState pattern

## Definition of Done

- [ ] TanStack Query configured and working
- [ ] All data fetching migrated to query hooks
- [ ] Query keys scoped by organization_id
- [ ] DevTools available in development
- [ ] No regression in data loading behavior
- [ ] `npm test` passes
- [ ] `npm run typecheck` passes
- [ ] Network tab shows reduced duplicate requests
