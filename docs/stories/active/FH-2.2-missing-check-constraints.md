# Story FH-2.2: Add missing CHECK constraints on status columns

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 2 — Data Integrity + UX
**Points:** 2
**Priority:** Medium
**Status:** Pending
**Agent:** @data-engineer

---

## Context

Phase 2 findings L6, L7: `procedures.status`, `sus_bpa.status`, and `sus_aih.status` accept any string value. Other status columns in the schema have proper CHECK constraints.

## Acceptance Criteria

- [ ] Add CHECK constraint to `procedures.status`: `CHECK (status IN ('pending', 'approved', 'denied', 'appealed'))`
- [ ] Add CHECK constraint to `sus_bpa.status`: `CHECK (status IN ('rascunho', 'validado', 'enviado', 'aprovado', 'rejeitado'))`
- [ ] Add CHECK constraint to `sus_aih.status`: `CHECK (status IN ('rascunho', 'validado', 'enviado', 'aprovado', 'rejeitado'))`
- [ ] Verify no existing data violates the new constraints before applying
- [ ] Write migration file `011_add_check_constraints.sql`
- [ ] All tests pass

## Technical Notes

- Run validation query first: `SELECT DISTINCT status FROM procedures` to check for unexpected values
- If unexpected values exist, clean data before adding constraint
- Match status values with the TypeScript enums in `src/types/database.ts`

## Files to Modify

- `supabase/migrations/011_add_check_constraints.sql` (NEW)

## Definition of Done

- [ ] Migration runs without errors
- [ ] Invalid status values rejected by database
- [ ] All tests pass
