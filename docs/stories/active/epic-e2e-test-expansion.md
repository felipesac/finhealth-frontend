# Epic: FINHEALTH-EPIC-2 — E2E Test Expansion

**Project:** FinHealth Frontend
**Created:** 2026-02-10
**Status:** Done
**Total Points:** 34

---

## Context

The brownfield remediation epic (FINHEALTH-EPIC-1) established a solid codebase with 459 unit/integration tests. However, E2E coverage is limited to 6 specs (25 test cases) covering only authentication flows. Zero core business flows have E2E coverage — accounts, glosas, payments, TISS, SUS, reports, settings, and dashboard are all uncovered.

This epic establishes comprehensive E2E testing across all critical user journeys using Playwright.

## Current State

| Domain | Routes | E2E Tests | Coverage |
|--------|--------|-----------|----------|
| Authentication | 3 | 25 | 100% |
| Dashboard | 1 | 0 | 0% |
| Accounts | 3 | 0 | 0% |
| Glosas | 4 | 0 | 0% |
| Payments | 4 | 0 | 0% |
| TISS | 6 | 0 | 0% |
| SUS | 5 | 0 | 0% |
| Reports | 6 | 0 | 0% |
| Settings | 5 | 0 | 0% |

## Goals

1. **E2E infra**: Authenticated test setup, fixtures, Page Object Model
2. **Critical business flows**: Accounts CRUD, glosas workflow, payment reconciliation
3. **Data entry flows**: TISS upload/validation, SUS forms
4. **Operational flows**: Dashboard, reports, settings/admin
5. **Cross-cutting**: Navigation, error handling, responsive behavior

## Sprint Plan

### Sprint 1 — Foundation + Core Business (16 pts)

| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| E2E-1.1 | Test infrastructure: auth helpers, fixtures, Page Object Model | 5 | Critical |
| E2E-1.2 | Dashboard and authenticated navigation | 3 | High |
| E2E-1.3 | Accounts CRUD flow | 5 | High |
| E2E-1.4 | Glosas management and appeal workflow | 3 | High |

### Sprint 2 — Financial + Data Entry (10 pts)

| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| E2E-2.1 | Payment reconciliation and delinquency | 3 | High |
| E2E-2.2 | TISS upload, validation, and batch processing | 5 | Medium |
| E2E-2.3 | SUS forms (BPA, AIH) and SIGTAP search | 2 | Medium |

### Sprint 3 — Operations + Polish (8 pts)

| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| E2E-3.1 | Reports generation and export | 3 | Medium |
| E2E-3.2 | Settings, user management, and audit log | 3 | Medium |
| E2E-3.3 | Error handling, responsive, and cross-cutting | 2 | Low |

## Technical Strategy

### Authentication
- Create `e2e/fixtures/auth.ts` with `authenticatedPage` fixture that handles login once via storage state
- Use Playwright's `storageState` to reuse auth across tests

### Page Object Model
- Create `e2e/pages/` directory with page objects per domain
- Encapsulate selectors and common actions for maintainability

### Test Data
- Create `e2e/fixtures/seed.ts` with helper functions to create test data via API
- Teardown after each test to keep isolation

### API Mocking
- Use Playwright's `page.route()` for API mocking where needed
- Prefer real API calls with seeded data for critical flows

## Definition of Done (Epic)

- [x] All 9 stories complete
- [x] E2E coverage across all 37 routes
- [x] CI-ready: tests run in headless mode
- [x] No flaky tests (retry count < 2%)
- [x] Page Object Model for all domains
