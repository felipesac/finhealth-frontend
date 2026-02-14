import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/dashboard.page';

test.describe('Dashboard', () => {
  test('renders dashboard heading and description', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.heading).toBeVisible();
    await expect(page.getByText('Visao geral do faturamento hospitalar')).toBeVisible();
  });

  test('renders 5 metric cards', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(await dashboard.getMetricByTitle('Faturamento Total')).toBeVisible();
    await expect(await dashboard.getMetricByTitle('Total em Glosas')).toBeVisible();
    await expect(await dashboard.getMetricByTitle('Pagamentos')).toBeVisible();
    await expect(await dashboard.getMetricByTitle('Contas Pendentes')).toBeVisible();
    await expect(await dashboard.getMetricByTitle('Taxa de Sucesso')).toBeVisible();
  });

  test('renders recent accounts table', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Table or empty state should be present
    const table = page.locator('table');
    const emptyState = page.getByText('Nenhuma conta encontrada');
    await expect(table.or(emptyState)).toBeVisible();
  });

  test('renders chart components or loading states', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Charts container or error/loading fallback should exist
    const charts = dashboard.chartsContainer;
    const chartError = page.getByText('Erro ao carregar graficos');
    const hasCharts = await charts.first().isVisible().catch(() => false);
    const hasError = await chartError.isVisible().catch(() => false);

    expect(hasCharts || hasError).toBeTruthy();
  });
});
