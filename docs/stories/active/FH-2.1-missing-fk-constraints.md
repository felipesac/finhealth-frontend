# Story FH-2.1: Add missing FK constraints and updated_at columns

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 2 — Data Integrity + UX
**Points:** 3
**Priority:** High
**Status:** Ready for Review
**Agent:** @data-engineer

---

## Context

Phase 2 findings M1, M2, M3: Four `user_id` columns lack FK to `auth.users`, `patients.health_insurance_id` is TEXT instead of UUID FK, and `procedures`/`payments` lack `updated_at` columns.

## Acceptance Criteria

- [x] Add `updated_at TIMESTAMPTZ DEFAULT NOW()` to `procedures` table
- [x] Add `updated_at TIMESTAMPTZ DEFAULT NOW()` to `payments` table
- [x] Add `BEFORE UPDATE` triggers for `updated_at` on both tables
- [x] Clean any orphaned records where `user_id` references non-existent auth.users
- [x] Add FK constraint `notifications.user_id → auth.users(id) ON DELETE CASCADE`
- [x] Add FK constraint `digital_certificates.user_id → auth.users(id) ON DELETE CASCADE`
- [x] Add FK constraint `sus_bpa.user_id → auth.users(id) ON DELETE CASCADE`
- [x] Add FK constraint `sus_aih.user_id → auth.users(id) ON DELETE CASCADE`
- [x] Evaluate `patients.health_insurance_id`: convert to UUID FK or remove if unused
- [x] Write migration file `010_add_missing_constraints.sql`
- [x] All tests pass

## Technical Notes

- Run orphan check query BEFORE adding FKs: `SELECT DISTINCT user_id FROM notifications WHERE user_id NOT IN (SELECT id FROM auth.users)`
- ON DELETE CASCADE ensures user deletion cleans up related records
- `patients.health_insurance_id` may need data migration if it contains string values

## Files to Modify

- `supabase/migrations/010_add_missing_constraints.sql` (NEW) [x]
- `src/types/database.ts` (ADD updated_at to Procedure/Payment, deprecate health_insurance_id) [x]
- `src/components/payments/PaymentsTable.test.tsx` (ADD updated_at to test fixtures) [x]

## Definition of Done

- [x] Migration runs without errors
- [x] No orphaned records exist
- [x] `updated_at` auto-updates on procedure/payment modification
- [x] FK violations prevented on insert
- [x] All tests pass
