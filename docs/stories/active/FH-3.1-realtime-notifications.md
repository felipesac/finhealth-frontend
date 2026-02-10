# Story FH-3.1: Replace notification polling with Supabase Realtime

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 3 — UX & Performance
**Points:** 3
**Priority:** High
**Status:** Pending
**Agent:** @dev

---

## Context

Phase 3 finding M-1: NotificationDropdown uses 60-second `setInterval` polling. Supabase Realtime is already configured and used for the dashboard via `useRealtimeSubscription` hook.

## Acceptance Criteria

- [ ] Replace `setInterval` in NotificationDropdown with `useRealtimeSubscription` on `notifications` table
- [ ] Subscribe to INSERT events (new notifications) and UPDATE events (read status changes)
- [ ] Maintain initial fetch on mount for existing notifications
- [ ] Unread count updates instantly when new notification arrives
- [ ] Remove `setInterval` and `clearInterval` cleanup
- [ ] Update tests for new subscription pattern
- [ ] If SWR was adopted in FH-2.4, integrate via `mutate()` on Realtime event

## Files to Modify

- `src/components/notifications/NotificationDropdown.tsx` (REWRITE)
- NotificationDropdown test file (UPDATE)

## Definition of Done

- [ ] Notifications appear within 1-2 seconds of creation (vs 60s before)
- [ ] No polling interval in code
- [ ] Realtime subscription properly cleaned up on unmount
- [ ] All tests pass
