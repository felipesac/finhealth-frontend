# Story FH-5.5: Add tests for modal and filter components

**Epic:** FINHEALTH-EPIC-3 (Security & Quality Hardening)
**Sprint:** 6 — Quality
**Points:** 3
**Priority:** Medium
**Status:** Ready for Development
**Agent:** @dev

---

## Context

Post-brownfield audit found 4 components without test files. These components handle user interactions (creating records, filtering data) and should be validated.

## Acceptance Criteria

### Modal Components

- [ ] Test `CreateGlosaModal` — render, form validation, submit, close, error handling
- [ ] Test `CreatePaymentModal` — render, form validation, submit, close, error handling

### Filter Components

- [ ] Test `GlosaFilters` — render, filter selection, filter reset, callback invocation
- [ ] Test `PaymentFilters` — render, filter selection, filter reset, callback invocation

### Test Patterns

- [ ] Wrap with `QueryClientProvider` if hooks are used
- [ ] Mock `fetch` for form submissions
- [ ] Test form validation (required fields, format validation)
- [ ] Test user interactions with `@testing-library/user-event`
- [ ] Test error states (API failure, validation failure)

## Files to Create

- `src/components/glosas/CreateGlosaModal.test.tsx`
- `src/components/payments/CreatePaymentModal.test.tsx`
- `src/components/glosas/GlosaFilters.test.tsx`
- `src/components/payments/PaymentFilters.test.tsx`

## Definition of Done

- [ ] All 4 test files created
- [ ] Each component has at least 4 test cases
- [ ] All tests pass
- [ ] Production build succeeds
