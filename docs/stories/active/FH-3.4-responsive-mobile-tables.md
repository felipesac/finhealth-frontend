# Story FH-3.4: Responsive card layout for mobile tables

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 3 — UX & Performance
**Points:** 5
**Priority:** Medium
**Status:** Pending
**Agent:** @dev + @ux-design-expert

---

## Context

Phase 3 finding M-6: Tables with many columns scroll horizontally on mobile, making them hard to use.

## Acceptance Criteria

- [ ] Create `src/components/ui/ResponsiveTable.tsx` — renders table on desktop, card list on mobile
- [ ] Breakpoint: table view on `md` (768px+), card view below
- [ ] Card view shows key fields (name/number, status badge, amount) with row action menu
- [ ] Apply to AccountsTable, GlosasTable, PaymentsTable as primary targets
- [ ] Card view maintains sorting and filtering functionality
- [ ] Bulk selection works in card view (checkboxes)
- [ ] Add tests for both render modes

## Files to Modify

- `src/components/ui/ResponsiveTable.tsx` (NEW)
- `src/components/accounts/AccountsTable.tsx` (UPDATE)
- `src/components/glosas/GlosasTable.tsx` (UPDATE)
- `src/components/payments/PaymentsTable.tsx` (UPDATE)
- Test files for above components

## Definition of Done

- [ ] Tables readable on 375px viewport (iPhone SE)
- [ ] Card layout shows key information without horizontal scroll
- [ ] Desktop table unchanged
- [ ] All tests pass
