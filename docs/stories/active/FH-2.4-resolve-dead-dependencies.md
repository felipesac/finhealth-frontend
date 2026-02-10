# Story FH-2.4: Resolve dead dependencies (SWR adoption or cleanup)

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 2 — Data Integrity + UX
**Points:** 5
**Priority:** High
**Status:** Done
**Agent:** @dev

---

## Context

Phase 5-7 validation confirmed that `swr@2.4.0` is installed but has zero imports in the entire `src/` directory. Two options exist:

- **Option A (Recommended):** Adopt SWR for client-side data fetching with stale-while-revalidate
- **Option B:** Remove SWR from package.json and rely on server-side fetching

## Acceptance Criteria (Option A — Adopt SWR)

- [x] Create `src/hooks/useSWRFetch.ts` — custom SWR hook wrapping fetch with auth headers
- [x] Migrate `NotificationDropdown` from `setInterval` polling to `useSWR` with `refreshInterval: 60000`
- [x] Add SWR for dashboard data fetching in client components
- [x] Add `SWRConfig` provider in root layout with global error handling
- [x] Configure `revalidateOnFocus: true` for fresh data on tab switch
- [x] All existing tests pass with SWR mocked
- [x] Remove manual `setInterval` polling from NotificationDropdown

## Acceptance Criteria (Option B — Remove)

- [ ] Remove `swr` from package.json
- [ ] Run `npm install` to update lock file
- [ ] Verify no import errors
- [ ] All tests pass

## Technical Notes

- SWR pairs well with Next.js (same team at Vercel)
- `useSWR('/api/notifications', fetcher, { refreshInterval: 60000 })` replaces manual polling
- Global `SWRConfig` in layout enables shared cache and error handling
- Stale-while-revalidate means instant UI with background refresh

## Files to Modify (Option A)

- `src/hooks/useSWRFetch.ts` (NEW)
- `src/components/notifications/NotificationDropdown.tsx` (REWRITE)
- `src/app/layout.tsx` or `src/app/(dashboard)/layout.tsx` (ADD SWRConfig provider)
- Test files for modified components

## Definition of Done

- [x] Decision documented (Option A or B) — Option A adopted
- [x] If A: SWR integrated for at least notifications + 1 other data source
- [ ] ~~If B: swr removed from package.json, no dead code~~ (N/A — Option A chosen)
- [x] All tests pass (437/437)
- [x] `npm run typecheck` passes
