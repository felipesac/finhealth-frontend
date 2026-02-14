# Story FH-5.6: Setup test coverage tooling

**Epic:** FINHEALTH-EPIC-3 (Security & Quality Hardening)
**Sprint:** 6 — Quality
**Points:** 1
**Priority:** Low
**Status:** Ready for Development
**Agent:** @dev

---

## Context

`npm run test:coverage` fails because `@vitest/coverage-v8` is not installed. Coverage reporting is needed to measure the impact of FH-5.4 and FH-5.5, and to maintain quality going forward.

## Acceptance Criteria

- [ ] Install `@vitest/coverage-v8` as dev dependency
- [ ] Configure coverage in `vitest.config.ts` (or `vite.config.ts`)
- [ ] Set coverage thresholds: statements 70%, branches 60%, functions 70%, lines 70%
- [ ] Exclude test files, config files, and generated files from coverage
- [ ] `npm run test:coverage` runs successfully and generates report
- [ ] Add coverage output directory to `.gitignore`

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

- [ ] `npm run test:coverage` succeeds
- [ ] Coverage report generated (text + HTML)
- [ ] Baseline coverage metrics documented
- [ ] Coverage directory gitignored
