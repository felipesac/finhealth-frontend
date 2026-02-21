# Story FH-2.3: Integrate client-side form validation with react-hook-form + Zod

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 2 — Data Integrity + UX
**Points:** 8
**Priority:** Critical
**Status:** Ready for Review
**Agent:** @dev

---

## Context

Phase 3 finding C-1: All 8+ form components use raw `useState` per field with no client-side validation. Errors only shown after server round-trip. `react-hook-form` (7.71.1) and `@hookform/resolvers` (5.2.2) are already installed. A shadcn `form.tsx` wrapper exists at `src/components/ui/form.tsx` but is never imported.

## Acceptance Criteria

- [x] Migrate `CreateAccountForm` to react-hook-form + zodResolver with `createAccountSchema`
- [x] Migrate `BpaForm` to react-hook-form + zodResolver with `susBpaSchema`
- [x] Migrate `AihForm` to react-hook-form + zodResolver with `susAihSchema`
- [x] Migrate `AppealForm` to react-hook-form + zodResolver with inline schema
- [x] Migrate `LoginForm` to react-hook-form + zodResolver with `loginSchema`
- [x] Migrate `ForgotPasswordForm` to react-hook-form + zodResolver with `forgotPasswordSchema`
- [x] Migrate `TissUploadForm` to react-hook-form where applicable
- [x] Use existing `src/components/ui/form.tsx` wrapper (FormField, FormItem, FormLabel, FormControl, FormMessage)
- [x] Field-level error messages shown inline below each field
- [x] Form-level error from API still handled via toast
- [x] All form tests updated to work with react-hook-form
- [x] No regressions in form submission flow

## Technical Notes

- Zod schemas already exist in `src/lib/validations.ts` — reuse them directly
- `zodResolver` from `@hookform/resolvers/zod` bridges react-hook-form + Zod
- `src/components/ui/form.tsx` already wraps react-hook-form Context — just import and use
- Pattern: `useForm({ resolver: zodResolver(schema) })` → `<FormField>` → `<FormControl>` → `<Input>`
- Keep `fetch()` submission pattern, just add client validation before submit

## Files Modified

- `src/lib/validations.ts` — Added `forgotPasswordSchema`
- `src/components/accounts/CreateAccountForm.tsx` — REWRITE: react-hook-form + zodResolver + defaultValues prop [x]
- `src/components/accounts/CreateAccountForm.test.tsx` — UPDATE: defaultValues pattern, zodResolver mock [x]
- `src/components/sus/BpaForm.tsx` — REWRITE: react-hook-form + zodResolver [x]
- `src/components/sus/BpaForm.test.tsx` — UPDATE: fireEvent.change for react-hook-form [x]
- `src/components/sus/AihForm.tsx` — REWRITE: react-hook-form + zodResolver (z.input for .default() fields) [x]
- `src/components/sus/AihForm.test.tsx` — UPDATE [x]
- `src/components/glosas/AppealForm.tsx` — REWRITE: react-hook-form + inline zod schema [x]
- `src/components/auth/LoginForm.tsx` — REWRITE: react-hook-form + zodResolver [x]
- `src/components/auth/LoginForm.test.tsx` — UPDATE: fireEvent.submit pattern [x]
- `src/components/auth/ForgotPasswordForm.tsx` — REWRITE: react-hook-form + zodResolver [x]
- `src/components/tiss/TissUploadForm.tsx` — UPDATE: accountId field with react-hook-form [x]

## Definition of Done

- [x] All forms validate on client before submission
- [x] Inline error messages display below invalid fields
- [x] Server-side validation still runs as fallback
- [x] All form tests pass with updated assertions (429 tests, 72 files)
- [x] `npm test` passes
- [x] `npm run typecheck` passes
