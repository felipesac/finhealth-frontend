# Story FH-3.4: Responsive card layout for mobile tables

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 3 — UX & Performance
**Points:** 5
**Priority:** Medium
**Status:** Ready for Review
**Agent:** @dev + @ux-design-expert

---

## Context

Phase 3 finding M-6: Tables with many columns scroll horizontally on mobile, making them hard to use.

## Acceptance Criteria

- [x] Create `src/components/ui/ResponsiveTable.tsx` — renders table on desktop, card list on mobile
- [x] Breakpoint: table view on `md` (768px+), card view below
- [x] Card view shows key fields (name/number, status badge, amount) with row action menu
- [x] Apply to AccountsTable, GlosasTable, PaymentsTable as primary targets
- [x] Card view maintains sorting and filtering functionality
- [x] Bulk selection works in card view (checkboxes)
- [x] Add tests for both render modes

## Files to Modify

- `src/components/ui/ResponsiveTable.tsx` (NEW)
- `src/components/accounts/AccountsTable.tsx` (UPDATE)
- `src/components/glosas/GlosasTable.tsx` (UPDATE)
- `src/components/payments/PaymentsTable.tsx` (UPDATE)
- Test files for above components

## File List

| File | Action |
|------|--------|
| `src/components/ui/ResponsiveTable.tsx` | NEW — CSS-based responsive wrapper (hidden md:block / block md:hidden) |
| `src/components/ui/ResponsiveTable.test.tsx` | NEW — 3 tests for responsive wrapper |
| `src/components/glosas/GlosasTable.tsx` | Modified — Added card view with checkboxes, status badge, amounts |
| `src/components/glosas/GlosasTable.test.tsx` | Modified — Added 4 card view tests |
| `src/components/accounts/AccountsTable.tsx` | Modified — Added card view with checkboxes, status badge, patient, amounts |
| `src/components/accounts/AccountsTable.test.tsx` | Modified — Added 4 card view tests |
| `src/components/payments/PaymentsTable.tsx` | Modified — Added card view with status badge, amounts, insurer |
| `src/components/payments/PaymentsTable.test.tsx` | Modified — Added 3 card view tests |

## Definition of Done

- [x] Tables readable on 375px viewport (iPhone SE)
- [x] Card layout shows key information without horizontal scroll
- [x] Desktop table unchanged
- [x] All tests pass (459/459)

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Change Log
- Created ResponsiveTable component using pure CSS breakpoints (hidden md:block / block md:hidden)
- GlosasTable: Added mobile card view with checkbox, glosa_code link, status badge, tipo, amounts, probability, date
- AccountsTable: Added mobile card view with checkbox, account_number link, status badge, patient, insurer, amounts, date
- PaymentsTable: Added mobile card view with payment_reference link, reconciliation badge, insurer, amounts, date
- All three tables use ResponsiveTable wrapper — same sorted/filtered data renders in both views
- Bulk selection checkboxes work in card view (GlosasTable, AccountsTable)
- Filters and sorting remain functional in card view (shared state)
- Updated all three test files to handle dual-rendered text (getAllByText instead of getByText)
- Added card-specific tests: data-testid assertions, ResponsiveTable class assertions, bulk selection checkbox counts
