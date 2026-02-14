# Story FH-2.5: Migrate data fetching from SWR to TanStack Query

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 2 — Data Quality + UX
**Points:** 5
**Priority:** High
**Status:** Done
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

TanStack Query provides all of these out of the box. SWR was installed but minimally used (2 components).

### Relation to FH-2.4

FH-2.4 (Done) resolved dead dependencies by removing unused SWR. This story adds TanStack Query as the strategic replacement with proper multi-tenant patterns.

## Acceptance Criteria

### Phase 1: Setup

- [x] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [x] Remove `swr` from dependencies
- [x] Create `QueryProvider` wrapper in `src/components/providers/QueryProvider.tsx`
- [x] Replace `SWRProvider` with `QueryProvider` in app layout
- [x] Configure default options (staleTime: 30s, gcTime: 5min, retry: 3/1)

### Phase 2: Query Key Strategy

- [x] Define query key factory in `src/lib/query-keys.ts`
- [x] All query keys include `organizationId` for tenant-scoped cache
- [x] Keys for: accounts, glosas, payments, dashboard, users, notifications, settings

### Phase 3: Custom Hooks

- [x] Create `src/hooks/queries/use-accounts.ts` — useAccounts, useAccount, useCreateAccount
- [x] Create `src/hooks/queries/use-glosas.ts` — useGlosas, useGlosa, useCreateGlosa
- [x] Create `src/hooks/queries/use-payments.ts` — usePayments, usePayment, useCreatePayment
- [x] Create `src/hooks/queries/use-dashboard.ts` — useDashboardMetrics
- [x] Create `src/hooks/queries/use-users.ts` — useUsers, useInviteUser, useUpdateUser
- [x] Create `src/hooks/queries/use-notifications.ts` — useNotifications, useMarkNotificationRead (with optimistic updates)
- [x] Create `src/hooks/queries/use-settings.ts` — useTissSettings, useNotificationPreferences + mutations
- [x] Each hook uses `queryKeys` factory for cache key consistency
- [x] Mutations include `onSuccess` invalidation of related queries

### Phase 4: Migration

- [x] Replace `useSWRFetch` in `UserManagement.tsx` with `useUsers` + mutations
- [x] Replace `useSWRFetch` in `NotificationDropdown.tsx` with `useNotifications` + optimistic mutations
- [x] Replace `fetch + useState + useEffect` in `ConfiguracoesPage` with query hooks
- [x] Delete `useSWRFetch.ts` (obsolete)
- [x] Delete `SWRProvider.tsx` (obsolete)

### Phase 5: DevTools & Quality

- [x] ReactQueryDevtools visible in development only
- [x] All existing tests updated (QueryClientProvider wrapper)
- [x] 460/460 tests pass
- [x] TypeScript 0 errors
- [x] ESLint clean
- [x] Production build succeeds

## Files Created

- `src/components/providers/QueryProvider.tsx` (NEW)
- `src/lib/query-keys.ts` (NEW)
- `src/hooks/queries/use-accounts.ts` (NEW)
- `src/hooks/queries/use-glosas.ts` (NEW)
- `src/hooks/queries/use-payments.ts` (NEW)
- `src/hooks/queries/use-dashboard.ts` (NEW)
- `src/hooks/queries/use-users.ts` (NEW)
- `src/hooks/queries/use-notifications.ts` (NEW)
- `src/hooks/queries/use-settings.ts` (NEW)

## Files Modified

- `src/app/layout.tsx` — SWRProvider → QueryProvider
- `src/components/admin/UserManagement.tsx` — useSWRFetch → useUsers + mutations
- `src/components/admin/UserManagement.test.tsx` — QueryClientProvider wrapper
- `src/components/notifications/NotificationDropdown.tsx` — useSWRFetch → useNotifications
- `src/components/notifications/NotificationDropdown.test.tsx` — QueryClientProvider wrapper
- `src/app/(dashboard)/configuracoes/page.tsx` — fetch+useState → query hooks
- `package.json` — +@tanstack/react-query, +@tanstack/react-query-devtools, -swr

## Files Deleted

- `src/hooks/useSWRFetch.ts`
- `src/components/providers/SWRProvider.tsx`

## Definition of Done

- [x] TanStack Query configured and working
- [x] All SWR usage migrated to TanStack Query hooks
- [x] Query keys scoped by organization_id
- [x] DevTools available in development
- [x] No regression in data loading behavior
- [x] `npm test` passes (460/460)
- [x] `npm run typecheck` passes (0 errors)
- [x] Production build succeeds
