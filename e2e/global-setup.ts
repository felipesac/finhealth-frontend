import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';

const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  // Skip auth setup if no test credentials configured
  if (!email || !password) {
    console.log('[global-setup] No E2E_TEST_EMAIL/E2E_TEST_PASSWORD set — skipping auth bootstrap');
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Wait for redirect to dashboard (successful login)
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Save authenticated state
    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log('[global-setup] Auth state saved to', STORAGE_STATE_PATH);
  } catch (error) {
    console.error('[global-setup] Auth bootstrap failed:', error);
    console.error('[global-setup] Authenticated tests will be skipped or fail.');
  } finally {
    await browser.close();
  }
}

export default globalSetup;
export { STORAGE_STATE_PATH };
