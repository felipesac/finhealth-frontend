# Story FH-2.3: Integrate client-side form validation with react-hook-form + Zod

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 2 — Data Integrity + UX
**Points:** 8
**Priority:** Critical
**Status:** Pending
**Agent:** @dev

---

## Context

Phase 3 finding C-1: All 8+ form components use raw `useState` per field with no client-side validation. Errors only shown after server round-trip. `react-hook-form` (7.71.1) and `@hookform/resolvers` (5.2.2) are already installed. A shadcn `form.tsx` wrapper exists at `src/components/ui/form.tsx` but is never imported.

## Acceptance Criteria

- [ ] Migrate `CreateAccountForm` to react-hook-form + zodResolver with `createAccountSchema`
- [ ] Migrate `BpaForm` to react-hook-form + zodResolver with `createBpaSchema`
- [ ] Migrate `AihForm` to react-hook-form + zodResolver with `createAihSchema`
- [ ] Migrate `AppealForm` to react-hook-form + zodResolver with `appealSchema`
- [ ] Migrate `LoginForm` to react-hook-form + zodResolver with `loginSchema`
- [ ] Migrate `ForgotPasswordForm` to react-hook-form + zodResolver
- [ ] Migrate `TissUploadForm` to react-hook-form where applicable
- [ ] Use existing `src/components/ui/form.tsx` wrapper (FormField, FormItem, FormLabel, FormControl, FormMessage)
- [ ] Field-level error messages shown inline below each field
- [ ] Form-level error from API still handled via toast
- [ ] All form tests updated to work with react-hook-form
- [ ] No regressions in form submission flow

## Technical Notes

- Zod schemas already exist in `src/lib/validations.ts` — reuse them directly
- `zodResolver` from `@hookform/resolvers/zod` bridges react-hook-form + Zod
- `src/components/ui/form.tsx` already wraps react-hook-form Context — just import and use
- Pattern: `useForm({ resolver: zodResolver(schema) })` → `<FormField>` → `<FormControl>` → `<Input>`
- Keep `fetch()` submission pattern, just add client validation before submit

## Files to Modify

- `src/components/accounts/CreateAccountForm.tsx` (REWRITE)
- `src/components/sus/BpaForm.tsx` (REWRITE)
- `src/components/sus/AihForm.tsx` (REWRITE)
- `src/components/glosas/AppealForm.tsx` (REWRITE)
- `src/components/auth/LoginForm.tsx` (REWRITE)
- `src/components/auth/ForgotPasswordForm.tsx` (REWRITE)
- `src/components/tiss/TissUploadForm.tsx` (UPDATE)
- Test files for all above components (UPDATE)

## Definition of Done

- [ ] All forms validate on client before submission
- [ ] Inline error messages display below invalid fields
- [ ] Server-side validation still runs as fallback
- [ ] All form tests pass with updated assertions
- [ ] `npm test` passes
- [ ] `npm run typecheck` passes
