import { test as base } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const STORAGE_STATE_PATH = path.join(__dirname, '..', '.auth', 'user.json');

/**
 * Check if authenticated storage state exists.
 * Tests using `authenticatedTest` will skip gracefully if auth is not configured.
 */
function hasAuthState(): boolean {
  return fs.existsSync(STORAGE_STATE_PATH);
}

/**
 * Authenticated test fixture.
 * Use this instead of `test` when the test requires a logged-in session.
 *
 * Usage:
 *   import { authenticatedTest as test } from '../fixtures/auth';
 *   test('my authenticated test', async ({ page }) => { ... });
 */
export const authenticatedTest = base.extend({
  storageState: async ({}, use) => {
    if (!hasAuthState()) {
      base.skip(true, 'Auth state not available — set E2E_TEST_EMAIL/PASSWORD and run global-setup');
      return;
    }
    await use(STORAGE_STATE_PATH);
  },
});

export { STORAGE_STATE_PATH, hasAuthState };
