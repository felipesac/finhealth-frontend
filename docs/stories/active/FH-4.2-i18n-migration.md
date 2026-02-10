# Story FH-4.2: Migrate hardcoded strings to next-intl message files

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 4 — Polish & Compliance
**Points:** 8
**Priority:** Low
**Status:** Pending
**Agent:** @dev

---

## Context

Phase 3 finding M-3: next-intl is configured with pt-BR.json and en.json message files, but ~200+ Portuguese strings are hardcoded directly in components.

## Acceptance Criteria

- [ ] Extract all hardcoded Portuguese strings from layout components (Sidebar, Header, Breadcrumbs, etc.)
- [ ] Extract all hardcoded Portuguese strings from form labels and buttons
- [ ] Extract all hardcoded Portuguese strings from error messages and toasts
- [ ] Extract all hardcoded Portuguese strings from empty states and status labels
- [ ] Add extracted strings to `messages/pt-BR.json` with logical namespace structure
- [ ] Add English translations to `messages/en.json`
- [ ] Use `useTranslations()` hook in client components
- [ ] Use `getTranslations()` in server components
- [ ] All existing tests updated with mocked translations
- [ ] Language switcher works if toggled (existing next-intl setup)

## Technical Notes

- Namespace suggestion: `nav`, `forms`, `accounts`, `glosas`, `payments`, `tiss`, `sus`, `settings`, `common`
- Breadcrumb segment labels (30 entries) should become translated
- StatusBadge labels should use translations
- Keep form validation messages from Zod schemas separate (they have their own i18n)

## Files to Modify

- `messages/pt-BR.json` (MAJOR UPDATE — add ~200 strings)
- `messages/en.json` (MAJOR UPDATE — add ~200 translations)
- All layout components (UPDATE to use useTranslations)
- All form components (UPDATE)
- All table/list components (UPDATE)
- All status/badge components (UPDATE)

## Definition of Done

- [ ] Zero hardcoded Portuguese strings in components
- [ ] pt-BR.json and en.json both complete
- [ ] Switching locale renders all text correctly
- [ ] All tests pass
