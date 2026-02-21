import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/dashboard.page';
import { SidebarPage } from './pages/sidebar.page';

test.describe('Authenticated Smoke Tests', () => {
  test('can access dashboard after login', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Should NOT be redirected to login
    await expect(page).not.toHaveURL(/.*login/);

    // Dashboard heading should be visible
    await expect(dashboard.heading).toBeVisible();
  });

  test('dashboard renders metric cards', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Verify key metric titles are present
    await expect(await dashboard.getMetricByTitle('Faturamento Total')).toBeVisible();
    await expect(await dashboard.getMetricByTitle('Contas Pendentes')).toBeVisible();
    await expect(await dashboard.getMetricByTitle('Taxa de Sucesso')).toBeVisible();
  });

  test('sidebar navigation is visible', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = new SidebarPage(page);

    // Sidebar nav should be present on desktop
    await expect(sidebar.nav).toBeVisible();
    await expect(sidebar.logo).toBeVisible();
  });

  test('can navigate to contas via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = new SidebarPage(page);

    await sidebar.navigateTo('Contas Medicas');
    await expect(page).toHaveURL(/.*contas/);
  });

  test('user menu shows in header', async ({ page }) => {
    await page.goto('/dashboard');

    // Header should have user menu button
    const userMenu = page.getByLabel('Menu do usuario');
    await expect(userMenu).toBeVisible();
  });
});
