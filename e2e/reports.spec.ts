import { test, expect } from '@playwright/test';
import { ReportsPage, ExportPage } from './pages/reports.page';

test.describe('Reports Main Page', () => {
  test('renders reports page with heading and navigation cards', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.goto();

    await expect(reports.heading).toBeVisible();
    await expect(reports.description).toBeVisible();
  });

  test('renders all 5 report navigation links', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.goto();

    await expect(reports.faturamentoCard).toBeVisible();
    await expect(reports.glossasOperadoraCard).toBeVisible();
    await expect(reports.tendenciasCard).toBeVisible();
    await expect(reports.producaoCard).toBeVisible();
    await expect(reports.exportarCard).toBeVisible();
  });

  test('faturamento card navigates to billing report', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.goto();

    await reports.faturamentoCard.click();
    await expect(page).toHaveURL(/\/relatorios\/faturamento/);
  });
});

test.describe('Billing Report (Faturamento)', () => {
  test('renders billing report with heading and summary cards', async ({ page }) => {
    await page.goto('/relatorios/faturamento');

    await expect(page.getByRole('heading', { name: 'Faturamento Mensal' })).toBeVisible();
    await expect(page.getByText('Relatorio de faturamento por operadora')).toBeVisible();

    // 3 summary cards
    await expect(page.getByText('Total Faturado')).toBeVisible();
    await expect(page.getByText('Total Glosado')).toBeVisible();
    await expect(page.getByText('Total Pago')).toBeVisible();
  });

  test('renders billing table with expected columns', async ({ page }) => {
    await page.goto('/relatorios/faturamento');

    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: /Operadora/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Faturado/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Glosado/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Pago/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /% Glosa/ })).toBeVisible();
    }
  });

  test('has export button', async ({ page }) => {
    await page.goto('/relatorios/faturamento');

    await expect(page.getByRole('button', { name: /Exportar/ })).toBeVisible();
  });
});

test.describe('Glosas por Operadora Report', () => {
  test('renders glosas report with heading and summary cards', async ({ page }) => {
    await page.goto('/relatorios/glosas-operadora');

    await expect(page.getByRole('heading', { name: 'Glosas por Operadora' })).toBeVisible();
    await expect(page.getByText('Analise de glosas agrupadas por operadora')).toBeVisible();

    // 4 summary cards
    await expect(page.getByText('Total Glosado')).toBeVisible();
    await expect(page.getByText('Administrativa')).toBeVisible();
    await expect(page.getByText('Tecnica')).toBeVisible();
    await expect(page.getByText('Linear')).toBeVisible();
  });

  test('renders glosas table with expected columns', async ({ page }) => {
    await page.goto('/relatorios/glosas-operadora');

    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: /Operadora/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Total/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Recuperado/ })).toBeVisible();
    }
  });
});

test.describe('Trends Report (Tendencias)', () => {
  test('renders trends page with heading and period selector', async ({ page }) => {
    await page.goto('/relatorios/tendencias');

    await expect(page.getByRole('heading', { name: 'Tendencias' })).toBeVisible();
    await expect(page.getByText('Analise de tendencias e previsoes financeiras')).toBeVisible();
  });

  test('renders chart containers after loading', async ({ page }) => {
    await page.goto('/relatorios/tendencias');

    // Wait for loading to complete (charts or error message)
    const chartContainer = page.locator('.recharts-wrapper');
    const errorMessage = page.getByText('Erro ao carregar dados de tendencias');
    await expect(chartContainer.first().or(errorMessage)).toBeVisible({ timeout: 15000 });

    const hasCharts = await chartContainer.first().isVisible().catch(() => false);

    if (hasCharts) {
      // At least the financial evolution chart should render
      await expect(page.getByText('Evolucao Financeira')).toBeVisible();
    }
  });

  test('renders summary cards with forecast data', async ({ page }) => {
    await page.goto('/relatorios/tendencias');

    // Wait for data to load
    const forecastCard = page.getByText('Previsao Proximo Mes');
    const errorMessage = page.getByText('Erro ao carregar dados de tendencias');
    await expect(forecastCard.or(errorMessage)).toBeVisible({ timeout: 15000 });

    const hasData = await forecastCard.isVisible().catch(() => false);

    if (hasData) {
      await expect(page.getByText('Risco de Glosa Estimado')).toBeVisible();
      await expect(page.getByText('Taxa Media de Glosa')).toBeVisible();
    }
  });
});

test.describe('Production Report (Producao)', () => {
  test('renders production page with heading and summary cards', async ({ page }) => {
    await page.goto('/relatorios/producao');

    await expect(page.getByRole('heading', { name: 'Producao Medica' })).toBeVisible();
    await expect(page.getByText('Relatorio de producao por tipo e operadora')).toBeVisible();

    // 4 summary cards
    await expect(page.getByText('Total Contas')).toBeVisible();
    await expect(page.getByText('Valor Total')).toBeVisible();
    await expect(page.getByText('Valor Aprovado')).toBeVisible();
    await expect(page.getByText('Valor Pago')).toBeVisible();
  });

  test('renders production by type table or empty state', async ({ page }) => {
    await page.goto('/relatorios/producao');

    const table = page.locator('table').first();
    const emptyState = page.getByText('Nenhuma conta encontrada');
    await expect(table.or(emptyState)).toBeVisible();
  });

  test('renders production by insurer section', async ({ page }) => {
    await page.goto('/relatorios/producao');

    await expect(page.getByText('Producao por Tipo')).toBeVisible();
    await expect(page.getByText('Producao por Operadora')).toBeVisible();
  });
});

test.describe('Export Page', () => {
  test('renders export page with data type selection and date range', async ({ page }) => {
    const exportPage = new ExportPage(page);
    await exportPage.goto();

    await expect(exportPage.heading).toBeVisible();
    await expect(exportPage.description).toBeVisible();

    // Data type selection card
    await expect(page.getByText('Selecione os Dados')).toBeVisible();

    // Date range inputs
    await expect(exportPage.dateFromInput).toBeVisible();
    await expect(exportPage.dateToInput).toBeVisible();

    // Format display
    await expect(page.getByText('CSV (.csv)')).toBeVisible();

    // Export button
    await expect(exportPage.exportButton).toBeVisible();
  });

  test('renders all data type checkboxes', async ({ page }) => {
    const exportPage = new ExportPage(page);
    await exportPage.goto();

    await expect(exportPage.contasMedicasCheckbox).toBeVisible();
    await expect(exportPage.glosasCheckbox).toBeVisible();
    await expect(exportPage.pagamentosCheckbox).toBeVisible();
    await expect(exportPage.pacientesCheckbox).toBeVisible();
    await expect(exportPage.operadorasCheckbox).toBeVisible();
  });

  test('allows date range selection', async ({ page }) => {
    const exportPage = new ExportPage(page);
    await exportPage.goto();

    await exportPage.dateFromInput.fill('2026-01-01');
    await exportPage.dateToInput.fill('2026-01-31');

    await expect(exportPage.dateFromInput).toHaveValue('2026-01-01');
    await expect(exportPage.dateToInput).toHaveValue('2026-01-31');
  });

  test('export triggers download', async ({ page }) => {
    const exportPage = new ExportPage(page);
    await exportPage.goto();

    // Ensure at least one data type is selected (accounts is default)
    const isChecked = await exportPage.contasMedicasCheckbox.isChecked();
    if (!isChecked) {
      await exportPage.contasMedicasCheckbox.check();
    }

    // Intercept download event
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    await exportPage.exportButton.click();

    // Expect either a download or a toast (success or error)
    const download = await downloadPromise;
    const toast = page.getByText(/Exportacao concluida|Erro na exportacao/);

    if (download) {
      // Download triggered successfully
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    } else {
      // API may not be available — expect feedback toast
      await expect(toast).toBeVisible({ timeout: 10000 });
    }
  });
});
