# Story FH-4.3: Accessibility polish (reduced-motion, badge focus, toast aria)

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 4 — Polish & Compliance
**Points:** 3
**Priority:** Low
**Status:** Pending
**Agent:** @dev + @ux-design-expert

---

## Context

Phase 3 findings L-2, L-5, L-7: Missing reduced-motion support, no focus-visible on interactive badges, and toast aria-live verification needed.

## Acceptance Criteria

- [ ] Add `motion-reduce:` variants to all animated elements (sidebar transition, button scale, theme toggle, skeleton pulse)
- [ ] Add `focus-visible:ring-2 focus-visible:ring-ring` to Badge component when used as interactive element
- [ ] Verify Radix Toast component uses `role="status"` or `aria-live="polite"` — fix if missing
- [ ] Add `prefers-reduced-motion: reduce` media query for CSS animations in globals.css
- [ ] Print styles: add handling for Recharts SVG elements (hide or render as static image)
- [ ] Test with screen reader (VoiceOver/NVDA) for toast announcements

## Files to Modify

- `src/components/ui/badge.tsx` (ADD focus styles for interactive use)
- `src/app/globals.css` (ADD reduced-motion media query)
- `src/components/layout/AppShell.tsx` (ADD motion-reduce variants)
- `src/components/layout/Sidebar.tsx` (ADD motion-reduce variants)
- `src/components/ui/button.tsx` (ADD motion-reduce for scale)
- `src/components/theme-toggle.tsx` (ADD motion-reduce for rotation)
- Verify toaster setup

## Definition of Done

- [ ] Animations disabled when OS reduced-motion is on
- [ ] Interactive badges have visible focus indicator
- [ ] Toast notifications announced to screen readers
- [ ] All tests pass
