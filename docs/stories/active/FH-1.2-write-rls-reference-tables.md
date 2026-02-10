# Story FH-1.2: Add write RLS policies for reference tables

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 1 — Security Hardening
**Points:** 3
**Priority:** Critical
**Status:** Done
**Agent:** @data-engineer

---

## Context

The Brownfield Discovery (Phase 2 finding C2) found that `patients` and `health_insurers` tables have only SELECT policies for the `authenticated` role. No INSERT, UPDATE, or DELETE policies exist, meaning writes only work via `service_role` key.

Currently, API routes use `createClient()` from `@supabase/ssr` which operates as the authenticated user. Writes to these tables may silently fail or require elevated privileges.

## Acceptance Criteria

- [x] Add INSERT policy for `patients`: admin and finance_manager roles can insert
- [x] Add UPDATE policy for `patients`: admin and finance_manager roles can update
- [x] Add DELETE policy for `patients`: admin only
- [x] Add INSERT policy for `health_insurers`: admin only
- [x] Add UPDATE policy for `health_insurers`: admin only
- [x] Add DELETE policy for `health_insurers`: admin only
- [x] Write migration file `009_write_rls_reference_tables.sql`
- [x] Verify CRUD operations work via API routes for authorized roles
- [x] Verify unauthorized roles get 403/RLS denial

## Technical Notes

- Use `auth.jwt() -> 'user_metadata' ->> 'role'` in policy expressions
- Consider using `is_admin()` function for admin checks
- May need a new `is_finance_manager()` function or use direct JWT check
- Test with different role users to verify policy enforcement

## Files to Modify

- `supabase/migrations/009_write_rls_reference_tables.sql` (NEW)
- Possibly `src/lib/rbac.ts` if role check functions need updates

## Definition of Done

- [x] Migration applied successfully
- [x] Admin can CRUD both tables
- [x] Finance manager can CRUD patients, read-only health_insurers
- [x] Auditor gets RLS denial on writes
- [x] All tests pass
