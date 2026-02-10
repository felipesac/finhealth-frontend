# Story FH-3.1: Replace notification polling with Supabase Realtime

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 3 — UX & Performance
**Points:** 3
**Priority:** High
**Status:** Ready for Review
**Agent:** @dev

---

## Context

Phase 3 finding M-1: NotificationDropdown uses 60-second `setInterval` polling. Supabase Realtime is already configured and used for the dashboard via `useRealtimeSubscription` hook.

## Acceptance Criteria

- [x] Replace `setInterval` in NotificationDropdown with `useRealtimeSubscription` on `notifications` table
- [x] Subscribe to INSERT events (new notifications) and UPDATE events (read status changes)
- [x] Maintain initial fetch on mount for existing notifications
- [x] Unread count updates instantly when new notification arrives
- [x] Remove `setInterval` and `clearInterval` cleanup
- [x] Update tests for new subscription pattern
- [x] If SWR was adopted in FH-2.4, integrate via `mutate()` on Realtime event

## Files to Modify

- `src/components/notifications/NotificationDropdown.tsx` (REWRITE)
- `src/components/notifications/NotificationDropdown.test.tsx` (UPDATE)

## File List

| File | Action |
|------|--------|
| `src/components/notifications/NotificationDropdown.tsx` | Modified — replaced SWR polling with Realtime subscription |
| `src/components/notifications/NotificationDropdown.test.tsx` | Modified — added Realtime mock + 3 new tests |

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Change Log
- Removed `refreshInterval: 60000` from SWR config (no more polling)
- Added `useRealtimeSubscription` on `notifications` table with `event: '*'` (INSERT + UPDATE + DELETE)
- Realtime callback triggers `mutate()` to revalidate SWR cache instantly
- Added tests: Realtime subscription setup, mutate on Realtime event, SWR without polling

## Definition of Done

- [x] Notifications appear within 1-2 seconds of creation (vs 60s before)
- [x] No polling interval in code
- [x] Realtime subscription properly cleaned up on unmount (via useRealtimeSubscription hook)
- [x] All tests pass (439/439)
