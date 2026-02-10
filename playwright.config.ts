import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const STORAGE_STATE_PATH = path.join(__dirname, 'e2e', '.auth', 'user.json');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Unauthenticated tests (existing specs — login, forgot-password, etc.)
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /\/(login|forgot-password|reset-password|navigation|auth-flow|accessibility)\.spec\.ts$/,
    },
    // Authenticated tests (require login — dashboard, accounts, etc.)
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE_PATH,
      },
      testMatch: /\/(dashboard|accounts|glosas|payments|tiss|sus|reports|settings|sidebar-navigation|error-handling|responsive|cross-cutting|smoke)\.spec\.ts$/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
