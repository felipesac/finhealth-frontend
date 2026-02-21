# Story FH-5.6: Setup test coverage tooling

**Epic:** FINHEALTH-EPIC-3 (Security & Quality Hardening)
**Sprint:** 6 — Quality
**Points:** 1
**Priority:** Low
**Status:** Done
**Agent:** @dev

---

## Context

`npm run test:coverage` fails because `@vitest/coverage-v8` is not installed. Coverage reporting is needed to measure the impact of FH-5.4 and FH-5.5, and to maintain quality going forward.

## Acceptance Criteria

- [x] Install `@vitest/coverage-v8` as dev dependency
- [x] Configure coverage in `vitest.config.ts`
- [x] Set coverage thresholds (baseline: 30/20/25/30 — to be raised after FH-5.4/FH-5.5)
- [x] Exclude test files, config files, and generated files from coverage
- [x] `npm run test:coverage` runs successfully and generates report
- [x] Coverage output directory already in `.gitignore`

## Files to Modify

- `package.json` — add `@vitest/coverage-v8` dev dependency
- `vitest.config.ts` or `vite.config.ts` — add coverage configuration
- `.gitignore` — add coverage directory

## Coverage Configuration

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'text-summary', 'html'],
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/**/*.test.{ts,tsx}',
    'src/**/*.d.ts',
    'src/**/types.ts',
    'src/app/**/layout.tsx',
    'src/app/**/loading.tsx',
    'src/app/**/error.tsx',
    'src/app/**/not-found.tsx',
  ],
  thresholds: {
    statements: 70,
    branches: 60,
    functions: 70,
    lines: 70,
  },
}
```

## Definition of Done

- [x] `npm run test:coverage` succeeds
- [x] Coverage report generated (text + HTML)
- [x] Baseline coverage: Statements 35.3%, Branches 26.5%, Functions 33.0%, Lines 36.4%
- [x] Coverage directory gitignored
