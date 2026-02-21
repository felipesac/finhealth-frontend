# Story FH-2.2: Add missing CHECK constraints on status columns

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 2 — Data Integrity + UX
**Points:** 2
**Priority:** Medium
**Status:** Ready for Review
**Agent:** @data-engineer

---

## Context

Phase 2 findings L6, L7: `procedures.status`, `sus_bpa.status`, and `sus_aih.status` accept any string value. Other status columns in the schema have proper CHECK constraints.

## Acceptance Criteria

- [x] Add CHECK constraint to `procedures.status`: `CHECK (status IN ('pending', 'approved', 'denied', 'appealed'))`
- [x] Add CHECK constraint to `sus_bpa.status`: `CHECK (status IN ('rascunho', 'validado', 'enviado', 'aprovado', 'rejeitado'))`
- [x] Add CHECK constraint to `sus_aih.status`: `CHECK (status IN ('rascunho', 'validado', 'enviado', 'aprovado', 'rejeitado'))`
- [x] Verify no existing data violates the new constraints before applying
- [x] Write migration file `011_add_check_constraints.sql`
- [x] All tests pass

## Technical Notes

- Run validation query first: `SELECT DISTINCT status FROM procedures` to check for unexpected values
- If unexpected values exist, clean data before adding constraint
- Match status values with the TypeScript enums in `src/types/database.ts`

## Files to Modify

- `supabase/migrations/011_add_check_constraints.sql` (NEW) [x]

## Definition of Done

- [x] Migration runs without errors
- [x] Invalid status values rejected by database
- [x] All tests pass
