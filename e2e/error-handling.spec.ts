import { test, expect } from '@playwright/test';

test.describe('404 Page', () => {
  test('renders 404 page for unknown route', async ({ page }) => {
    await page.goto('/nonexistent-route-xyz');

    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Pagina nao encontrada')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voltar ao Dashboard' })).toBeVisible();
  });

  test('404 back button navigates to dashboard', async ({ page }) => {
    await page.goto('/nonexistent-route-xyz');

    await page.getByRole('link', { name: 'Voltar ao Dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Error Boundary', () => {
  test('error page renders with retry button on API failure', async ({ page }) => {
    // Mock API to return 500 to trigger error boundary
    await page.route('**/api/**', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto('/dashboard');

    // Error boundary should catch and show fallback UI
    const errorHeading = page.getByText(/Erro/);
    const retryButton = page.getByRole('button', { name: 'Tentar Novamente' });

    await expect(errorHeading.or(retryButton)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Loading States', () => {
  test('loading skeleton displays during data fetch', async ({ page }) => {
    // Delay API responses to see loading state
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/dashboard');

    // Skeleton elements should appear with animate-pulse
    const skeleton = page.locator('.animate-pulse');
    const spinner = page.locator('.animate-spin');
    await expect(skeleton.first().or(spinner.first())).toBeVisible({ timeout: 3000 });
  });
});
