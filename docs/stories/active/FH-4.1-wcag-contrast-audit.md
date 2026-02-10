# Story FH-4.1: WCAG AA contrast audit and fixes

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 4 — Polish & Compliance
**Points:** 3
**Priority:** Low
**Status:** Pending
**Agent:** @ux-design-expert + @dev

---

## Context

Phase 3 finding L-4: HSL color tokens have not been validated for WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text).

## Acceptance Criteria

- [ ] Audit all color token combinations for WCAG AA compliance (both light and dark themes)
- [ ] Focus on: muted-foreground on muted, muted-foreground on background, chart colors on white/dark
- [ ] Fix any contrast ratio below 4.5:1 for normal text
- [ ] Fix any contrast ratio below 3:1 for large text (>= 18pt or 14pt bold)
- [ ] Document all color token contrast ratios in a table
- [ ] No visual regression (maintain design intent while improving contrast)

## Files to Modify

- `src/app/globals.css` (UPDATE CSS variables if needed)
- Documentation of contrast ratios

## Definition of Done

- [ ] All text meets WCAG AA contrast requirements
- [ ] Contrast audit table documented
- [ ] Visual review confirms design quality maintained
