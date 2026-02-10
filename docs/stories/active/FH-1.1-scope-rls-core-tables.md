# Story FH-1.1: Scope RLS policies on core business tables

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 1 — Security Hardening
**Points:** 8
**Priority:** Critical
**Status:** Pending
**Agent:** @data-engineer + @dev

---

## Context

The Brownfield Discovery (Phase 2 finding C1) revealed that `medical_accounts`, `procedures`, `glosas`, and `payments` have RLS policies allowing ANY authenticated user full CRUD access to ALL records:

```sql
CREATE POLICY "Authenticated write" ON medical_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

This means RBAC is enforced only at the API level. If any API route has a bug, or if a user accesses Supabase directly via the anon key, they can read/modify any record.

## Acceptance Criteria

- [ ] Add `created_by UUID NOT NULL DEFAULT auth.uid()` column to `medical_accounts`, `procedures`, `glosas`, `payments`
- [ ] Backfill `created_by` on existing records (use admin user ID or first user)
- [ ] Replace `FOR ALL TO authenticated USING (true)` with `USING (auth.uid() = created_by)`
- [ ] Update `WITH CHECK` to enforce `created_by = auth.uid()` on INSERT
- [ ] Admin role bypasses scoping via `is_admin()` function
- [ ] All 32+ API routes continue to work correctly with new RLS
- [ ] Write migration file `008_scope_rls_core_tables.sql`
- [ ] All existing tests pass
- [ ] Add RLS-specific tests for scoped access

## Technical Notes

- Decision required: `created_by` (simple) vs `organization_id` (multi-tenant)
- The `is_admin()` function already exists and checks JWT metadata
- API routes use `createClient()` which respects RLS — this change will automatically scope data
- Procedures have FK CASCADE from medical_accounts — ensure `created_by` is consistent

## Files to Modify

- `supabase/migrations/008_scope_rls_core_tables.sql` (NEW)
- API routes may need adjustment if they query across users (admin views)
- Test files for affected API routes

## Definition of Done

- [ ] Migration applied successfully
- [ ] RLS scoping verified via Supabase SQL editor
- [ ] All API routes tested with non-admin user
- [ ] Admin user can still see all records
- [ ] `npm test` passes
- [ ] `npm run typecheck` passes
