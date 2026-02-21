# Story FH-5.4: Add unit tests for custom hooks

**Epic:** FINHEALTH-EPIC-3 (Security & Quality Hardening)
**Sprint:** 6 — Quality
**Points:** 5
**Priority:** Medium
**Status:** Done
**Agent:** @dev

---

## Context

Post-brownfield audit found 13 custom hooks without unit tests. Hooks contain critical business logic (data fetching, realtime subscriptions, debouncing, keyboard shortcuts) that should be validated.

## Acceptance Criteria

### TanStack Query Hooks (7 hooks)

- [x] Test `use-accounts.ts` — useAccounts, useAccount, useCreateAccount (7 tests)
- [x] Test `use-glosas.ts` — useGlosas, useGlosa, useCreateGlosa (6 tests)
- [x] Test `use-payments.ts` — usePayments, usePayment, useCreatePayment (6 tests)
- [x] Test `use-dashboard.ts` — useDashboardMetrics (3 tests)
- [x] Test `use-users.ts` — useUsers, useInviteUser, useUpdateUser (6 tests)
- [x] Test `use-notifications.ts` — useNotifications, useMarkNotificationRead (6 tests)
- [x] Test `use-settings.ts` — useTissSettings, useNotificationPreferences, mutations (9 tests)

### Utility Hooks (4+ hooks)

- [x] Test `useRealtimeSubscription.ts` — subscription setup, callback invocation, cleanup (5 tests)
- [x] Test `useRealtimeTable.ts` — INSERT/UPDATE/DELETE handling, setData (5 tests)
- [x] Test `use-debounce.ts` — debounce timing, value updates, cleanup (5 tests)
- [x] Test `useKeyboardShortcuts.ts` — shortcut registration, handler invocation (10 tests)

### Test Patterns

- [x] Use `renderHook` from `@testing-library/react`
- [x] Wrap TanStack Query hooks with `QueryClientProvider` in test wrapper
- [x] Mock `fetch` for API hooks
- [x] Mock Supabase client for realtime hooks
- [x] Test error states and loading states

## Files to Create

- `src/hooks/queries/__tests__/use-accounts.test.ts`
- `src/hooks/queries/__tests__/use-glosas.test.ts`
- `src/hooks/queries/__tests__/use-payments.test.ts`
- `src/hooks/queries/__tests__/use-dashboard.test.ts`
- `src/hooks/queries/__tests__/use-users.test.ts`
- `src/hooks/queries/__tests__/use-notifications.test.ts`
- `src/hooks/queries/__tests__/use-settings.test.ts`
- `src/hooks/__tests__/useRealtimeSubscription.test.ts`
- `src/hooks/__tests__/useRealtimeTable.test.ts`
- `src/hooks/__tests__/use-debounce.test.ts`
- `src/hooks/__tests__/useKeyboardShortcuts.test.ts`

## Definition of Done

- [x] All 11 hook test files created (68 tests total)
- [x] Each hook has at least 3 test cases (success, error, edge case)
- [x] All tests pass (537/537)
- [x] Production build succeeds
