# Story FH-4.4: Database schema cleanup

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 4 — Polish & Compliance
**Points:** 2
**Priority:** Low
**Status:** Pending
**Agent:** @data-engineer

---

## Context

Phase 2 findings L1-L5, M6: Various cosmetic and minor structural issues in the database schema.

## Acceptance Criteria

- [ ] Remove redundant B-tree index on `tuss_procedures.code` (UNIQUE constraint already creates one)
- [ ] Consolidate `update_tuss_updated_at()` function — redirect trigger to use `update_updated_at()` instead
- [ ] Add composite index on `medical_accounts(status, created_at DESC)` for common list queries
- [ ] Optionally: normalize `tuss_procedures.unit_price` from DECIMAL(10,2) to DECIMAL(12,2) for consistency
- [ ] Optionally: resize `health_insurers.ans_code` from VARCHAR(20) to VARCHAR(6) if no data exceeds 6 chars
- [ ] Write migration file `012_schema_cleanup.sql`

## Technical Notes

- Run `SELECT MAX(LENGTH(ans_code)) FROM health_insurers` before resizing
- Dropping an index is safe and non-destructive
- Function consolidation: alter trigger to reference existing function, then drop duplicate

## Files to Modify

- `supabase/migrations/012_schema_cleanup.sql` (NEW)

## Definition of Done

- [ ] Migration runs without errors
- [ ] No redundant indexes
- [ ] Single `update_updated_at()` function used by all triggers
- [ ] All tests pass
