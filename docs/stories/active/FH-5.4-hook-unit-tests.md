# Story FH-5.4: Add unit tests for custom hooks

**Epic:** FINHEALTH-EPIC-3 (Security & Quality Hardening)
**Sprint:** 6 — Quality
**Points:** 5
**Priority:** Medium
**Status:** Ready for Development
**Agent:** @dev

---

## Context

Post-brownfield audit found 13 custom hooks without unit tests. Hooks contain critical business logic (data fetching, realtime subscriptions, debouncing, keyboard shortcuts) that should be validated.

## Acceptance Criteria

### TanStack Query Hooks (7 hooks)

- [ ] Test `use-accounts.ts` — useAccounts, useAccount, useCreateAccount
- [ ] Test `use-glosas.ts` — useGlosas, useGlosa, useCreateGlosa
- [ ] Test `use-payments.ts` — usePayments, usePayment, useCreatePayment
- [ ] Test `use-dashboard.ts` — useDashboardMetrics
- [ ] Test `use-users.ts` — useUsers, useInviteUser, useUpdateUser
- [ ] Test `use-notifications.ts` — useNotifications, useMarkNotificationRead (optimistic updates)
- [ ] Test `use-settings.ts` — useTissSettings, useNotificationPreferences, mutations

### Utility Hooks (4+ hooks)

- [ ] Test `useRealtimeSubscription.ts` — subscription setup, callback invocation, cleanup
- [ ] Test `useRealtimeTable.ts` — table subscription pattern
- [ ] Test `use-debounce.ts` — debounce timing, value updates
- [ ] Test `useKeyboardShortcuts.ts` — shortcut registration, handler invocation

### Test Patterns

- [ ] Use `renderHook` from `@testing-library/react`
- [ ] Wrap TanStack Query hooks with `QueryClientProvider` in test wrapper
- [ ] Mock `fetch` for API hooks
- [ ] Mock Supabase client for realtime hooks
- [ ] Test error states and loading states

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

- [ ] All 11+ hook test files created
- [ ] Each hook has at least 3 test cases (success, error, edge case)
- [ ] All tests pass
- [ ] Production build succeeds
