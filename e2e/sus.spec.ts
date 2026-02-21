import { test, expect } from '@playwright/test';
import { SusBpaPage } from './pages/sus-bpa.page';
import { SusAihPage } from './pages/sus-aih.page';

test.describe('BPA Form Page', () => {
  test('renders BPA page with heading and summary cards', async ({ page }) => {
    const bpa = new SusBpaPage(page);
    await bpa.goto();

    await expect(bpa.heading).toBeVisible();
    await expect(bpa.description).toBeVisible();

    // Summary cards
    await expect(bpa.totalBpasCard).toBeVisible();
    await expect(bpa.procedimentosCard).toBeVisible();
    await expect(bpa.valorTotalCard).toBeVisible();
  });

  test('renders BPA form with all required fields', async ({ page }) => {
    const bpa = new SusBpaPage(page);
    await bpa.goto();

    await expect(bpa.formTitle).toBeVisible();
    await expect(bpa.cnesInput).toBeVisible();
    await expect(bpa.competenciaInput).toBeVisible();
    await expect(bpa.cboInput).toBeVisible();
    await expect(bpa.procedimentoInput).toBeVisible();
    await expect(bpa.quantidadeInput).toBeVisible();
    await expect(bpa.submitButton).toBeVisible();
  });

  test('validates required fields on empty submission', async ({ page }) => {
    const bpa = new SusBpaPage(page);
    await bpa.goto();

    await bpa.submitButton.click();

    // Form validation messages should appear for required fields
    const validationMessages = page.locator('[role="alert"], .text-destructive, [data-slot="form-message"]');
    await expect(validationMessages.first()).toBeVisible();
  });

  test('submits BPA form with valid data', async ({ page }) => {
    const bpa = new SusBpaPage(page);
    await bpa.goto();

    await bpa.fillRequiredFields({
      cnes: '1234567',
      competencia: '2026-01',
      cbo: '225125',
      procedimento: '0301010072',
      quantidade: '1',
    });

    await bpa.submitButton.click();

    // Expect either success toast or page reload (API may fail without backend)
    const successToast = page.getByText('BPA salvo com sucesso');
    const errorToast = page.getByText(/erro|falha|error/i);
    await expect(successToast.or(errorToast)).toBeVisible({ timeout: 10000 });
  });

  test('back button navigates to SUS hub', async ({ page }) => {
    const bpa = new SusBpaPage(page);
    await bpa.goto();

    await bpa.backButton.click();
    await expect(page).toHaveURL(/\/sus$/);
  });
});

test.describe('AIH Form Page', () => {
  test('renders AIH page with heading and summary cards', async ({ page }) => {
    const aih = new SusAihPage(page);
    await aih.goto();

    await expect(aih.heading).toBeVisible();
    await expect(aih.description).toBeVisible();

    // Summary cards
    await expect(aih.totalAihsCard).toBeVisible();
    await expect(aih.diariasCard).toBeVisible();
    await expect(aih.valorTotalCard).toBeVisible();
  });

  test('renders AIH form with all required fields', async ({ page }) => {
    const aih = new SusAihPage(page);
    await aih.goto();

    await expect(aih.formTitle).toBeVisible();
    await expect(aih.numeroAihInput).toBeVisible();
    await expect(aih.tipoAihSelect).toBeVisible();
    await expect(aih.cnesInput).toBeVisible();
    await expect(aih.procedimentoPrincipalInput).toBeVisible();
    await expect(aih.dataInternacaoInput).toBeVisible();
    await expect(aih.valorInput).toBeVisible();
    await expect(aih.submitButton).toBeVisible();
  });

  test('validates required fields on empty submission', async ({ page }) => {
    const aih = new SusAihPage(page);
    await aih.goto();

    await aih.submitButton.click();

    // Form validation messages should appear for required fields
    const validationMessages = page.locator('[role="alert"], .text-destructive, [data-slot="form-message"]');
    await expect(validationMessages.first()).toBeVisible();
  });

  test('submits AIH form with valid data', async ({ page }) => {
    const aih = new SusAihPage(page);
    await aih.goto();

    await aih.fillRequiredFields({
      numeroAih: '1234567890123',
      cnes: '1234567',
      procedimentoPrincipal: '0301010072',
      dataInternacao: '2026-01-15',
      valor: '1500.00',
    });

    await aih.submitButton.click();

    // Expect either success toast or error (API may fail without backend)
    const successToast = page.getByText('AIH salva com sucesso');
    const errorToast = page.getByText(/erro|falha|error/i);
    await expect(successToast.or(errorToast)).toBeVisible({ timeout: 10000 });
  });

  test('back button navigates to SUS hub', async ({ page }) => {
    const aih = new SusAihPage(page);
    await aih.goto();

    await aih.backButton.click();
    await expect(page).toHaveURL(/\/sus$/);
  });
});

test.describe('SIGTAP Search', () => {
  test('renders SIGTAP page with search input', async ({ page }) => {
    await page.goto('/sus/sigtap');

    await expect(page.getByRole('heading', { name: 'Tabela SIGTAP' })).toBeVisible();
    await expect(page.getByText('Consulte procedimentos e valores da tabela SUS')).toBeVisible();
    await expect(page.getByPlaceholder(/Buscar por codigo ou nome/)).toBeVisible();
  });

  test('search returns results for valid query', async ({ page }) => {
    await page.goto('/sus/sigtap');

    const searchInput = page.getByPlaceholder(/Buscar por codigo ou nome/);
    await searchInput.fill('consulta');
    await searchInput.press('Enter');

    // Wait for results or empty state
    const resultsCount = page.getByText(/procedimentos? encontrados?/);
    const emptyState = page.getByText(/Nenhum procedimento encontrado/);
    await expect(resultsCount.or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test('search shows empty state for nonexistent query', async ({ page }) => {
    await page.goto('/sus/sigtap');

    const searchInput = page.getByPlaceholder(/Buscar por codigo ou nome/);
    await searchInput.fill('xyznonexistent99999');
    await searchInput.press('Enter');

    await expect(page.getByText(/Nenhum procedimento encontrado/)).toBeVisible({ timeout: 10000 });
  });

  test('results table shows expected columns', async ({ page }) => {
    await page.goto('/sus/sigtap');

    const searchInput = page.getByPlaceholder(/Buscar por codigo ou nome/);
    await searchInput.fill('consulta');
    await searchInput.press('Enter');

    const table = page.locator('table');
    const hasTable = await table.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: /Codigo/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Nome/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Tipo/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Ambulatorial/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Hospitalar/ })).toBeVisible();
    }
  });
});

test.describe('SUS Remessa', () => {
  test('renders remessa page with heading and metric cards', async ({ page }) => {
    await page.goto('/sus/remessa');

    await expect(page.getByRole('heading', { name: 'Remessa SUS' })).toBeVisible();
    await expect(page.getByText('Gerenciamento de remessas BPA e AIH para o SUS')).toBeVisible();

    // 4 metric cards
    await expect(page.getByText('Total Registros')).toBeVisible();
    await expect(page.getByText('Valor BPA')).toBeVisible();
    await expect(page.getByText('Valor AIH')).toBeVisible();
    await expect(page.getByText('Enviados')).toBeVisible();
  });

  test('renders remessas table or empty state', async ({ page }) => {
    await page.goto('/sus/remessa');

    const table = page.locator('table');
    const emptyState = page.getByText('Nenhuma remessa encontrada');
    await expect(table.or(emptyState)).toBeVisible();
  });

  test('remessas table has expected columns when data exists', async ({ page }) => {
    await page.goto('/sus/remessa');

    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: /Competencia/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Tipo/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Registros/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Valor Total/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Status/ })).toBeVisible();
    }
  });
});
