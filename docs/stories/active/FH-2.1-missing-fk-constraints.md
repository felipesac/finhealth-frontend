# Story FH-2.1: Add missing FK constraints and updated_at columns

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 2 — Data Integrity + UX
**Points:** 3
**Priority:** High
**Status:** Pending
**Agent:** @data-engineer

---

## Context

Phase 2 findings M1, M2, M3: Four `user_id` columns lack FK to `auth.users`, `patients.health_insurance_id` is TEXT instead of UUID FK, and `procedures`/`payments` lack `updated_at` columns.

## Acceptance Criteria

- [ ] Add `updated_at TIMESTAMPTZ DEFAULT NOW()` to `procedures` table
- [ ] Add `updated_at TIMESTAMPTZ DEFAULT NOW()` to `payments` table
- [ ] Add `BEFORE UPDATE` triggers for `updated_at` on both tables
- [ ] Clean any orphaned records where `user_id` references non-existent auth.users
- [ ] Add FK constraint `notifications.user_id → auth.users(id) ON DELETE CASCADE`
- [ ] Add FK constraint `digital_certificates.user_id → auth.users(id) ON DELETE CASCADE`
- [ ] Add FK constraint `sus_bpa.user_id → auth.users(id) ON DELETE CASCADE`
- [ ] Add FK constraint `sus_aih.user_id → auth.users(id) ON DELETE CASCADE`
- [ ] Evaluate `patients.health_insurance_id`: convert to UUID FK or remove if unused
- [ ] Write migration file `010_add_missing_constraints.sql`
- [ ] All tests pass

## Technical Notes

- Run orphan check query BEFORE adding FKs: `SELECT DISTINCT user_id FROM notifications WHERE user_id NOT IN (SELECT id FROM auth.users)`
- ON DELETE CASCADE ensures user deletion cleans up related records
- `patients.health_insurance_id` may need data migration if it contains string values

## Files to Modify

- `supabase/migrations/010_add_missing_constraints.sql` (NEW)
- `src/types/database.ts` (ADD updated_at to Procedure and Payment interfaces)

## Definition of Done

- [ ] Migration runs without errors
- [ ] No orphaned records exist
- [ ] `updated_at` auto-updates on procedure/payment modification
- [ ] FK violations prevented on insert
- [ ] All tests pass
