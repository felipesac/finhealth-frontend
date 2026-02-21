import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  // These tests require an authenticated session.
  // In a real setup, use a global setup to authenticate via API.
  // For now, they verify that unauthenticated users are redirected.

  test('unauthenticated user cannot access contas', async ({ page }) => {
    await page.goto('/contas');
    await expect(page).toHaveURL(/.*login/);
  });

  test('unauthenticated user cannot access glosas', async ({ page }) => {
    await page.goto('/glosas');
    await expect(page).toHaveURL(/.*login/);
  });

  test('unauthenticated user cannot access pagamentos', async ({ page }) => {
    await page.goto('/pagamentos');
    await expect(page).toHaveURL(/.*login/);
  });

  test('unauthenticated user cannot access relatorios', async ({ page }) => {
    await page.goto('/relatorios');
    await expect(page).toHaveURL(/.*login/);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  });
});
