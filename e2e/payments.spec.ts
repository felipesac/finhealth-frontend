import { test, expect } from '@playwright/test';
import { PaymentsListPage } from './pages/payments-list.page';
import { ReconciliationPage } from './pages/reconciliation.page';

test.describe('Payments List', () => {
  test('renders payments page with heading and summary cards', async ({ page }) => {
    const payments = new PaymentsListPage(page);
    await payments.goto();

    await expect(payments.heading).toBeVisible();
    await expect(payments.description).toBeVisible();

    // Summary cards should render
    await expect(payments.totalReceivedCard).toBeVisible();
    await expect(payments.matchedCard).toBeVisible();
    await expect(payments.differenceCard).toBeVisible();
    await expect(payments.pendingCard).toBeVisible();
  });

  test('renders payments table or empty state', async ({ page }) => {
    const payments = new PaymentsListPage(page);
    await payments.goto();

    await expect(payments.table.or(payments.emptyState)).toBeVisible();
  });

  test('renders table with expected columns', async ({ page }) => {
    const payments = new PaymentsListPage(page);
    await payments.goto();

    const hasTable = await payments.table.isVisible().catch(() => false);

    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: /Referencia/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Operadora/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Valor Total/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Status/ })).toBeVisible();
    }
  });

  test('search filters payments', async ({ page }) => {
    const payments = new PaymentsListPage(page);
    await payments.goto();

    await expect(payments.searchInput).toBeVisible();
    await payments.searchByReference('NONEXISTENT999');
    await page.waitForTimeout(600);

    await expect(payments.emptyState).toBeVisible();
  });

  test('status filter is available', async ({ page }) => {
    const payments = new PaymentsListPage(page);
    await payments.goto();

    const statusTrigger = page.locator('button').filter({ hasText: /Status|Todos/ }).first();
    await expect(statusTrigger).toBeVisible();
  });

  test('payment upload section is visible', async ({ page }) => {
    const payments = new PaymentsListPage(page);
    await payments.goto();

    await expect(payments.uploadCard).toBeVisible();
    await expect(page.getByText('Importe pagamentos a partir de um arquivo CSV ou OFX')).toBeVisible();
  });
});

test.describe('Payment Detail', () => {
  test('navigating to payment detail from list', async ({ page }) => {
    const payments = new PaymentsListPage(page);
    await payments.goto();

    const paymentLink = page.locator('table tbody a').first();
    const hasLinks = await paymentLink.isVisible().catch(() => false);

    if (hasLinks) {
      await paymentLink.click();
      await expect(page).toHaveURL(/\/pagamentos\/[a-f0-9-]+/);

      // Detail cards should be visible
      await expect(page.getByText('Detalhes do Pagamento')).toBeVisible();
      await expect(page.getByText('Conciliacao')).toBeVisible();
    }
  });

  test('payment detail shows reconciliation values', async ({ page }) => {
    const payments = new PaymentsListPage(page);
    await payments.goto();

    const paymentLink = page.locator('table tbody a').first();
    const hasLinks = await paymentLink.isVisible().catch(() => false);

    if (hasLinks) {
      await paymentLink.click();
      await expect(page).toHaveURL(/\/pagamentos\/[a-f0-9-]+/);

      await expect(page.getByText('Valor Total')).toBeVisible();
      await expect(page.getByText('Valor Conciliado')).toBeVisible();
    }
  });
});

test.describe('Reconciliation Page', () => {
  test('renders reconciliation page with summary cards', async ({ page }) => {
    const reconciliation = new ReconciliationPage(page);
    await reconciliation.goto();

    await expect(reconciliation.heading).toBeVisible();
    await expect(reconciliation.description).toBeVisible();

    // 4 summary cards
    await expect(reconciliation.totalPaymentsCard).toBeVisible();
    await expect(reconciliation.matchedCard).toBeVisible();
    await expect(reconciliation.partialCard).toBeVisible();
    await expect(reconciliation.pendingCard).toBeVisible();
  });

  test('renders reconciliation table or empty state', async ({ page }) => {
    const reconciliation = new ReconciliationPage(page);
    await reconciliation.goto();

    await expect(reconciliation.table.or(reconciliation.emptyState)).toBeVisible();
  });
});

test.describe('Delinquency Page', () => {
  test('renders delinquency page with summary cards', async ({ page }) => {
    await page.goto('/pagamentos/inadimplencia');

    await expect(page.getByRole('heading', { name: 'Inadimplencia' })).toBeVisible();
    await expect(page.getByText('Contas com pagamento pendente ha mais de 30 dias')).toBeVisible();

    // 4 summary cards
    await expect(page.getByText('Contas em Atraso')).toBeVisible();
    await expect(page.getByText('Valor Pendente')).toBeVisible();
    await expect(page.getByText('Maior Devedora')).toBeVisible();
    await expect(page.getByText('Media de Atraso')).toBeVisible();
  });

  test('renders delinquency table or empty state', async ({ page }) => {
    await page.goto('/pagamentos/inadimplencia');

    const table = page.locator('table');
    const emptyState = page.getByText('Nenhuma conta inadimplente encontrada');
    await expect(table.or(emptyState)).toBeVisible();
  });
});
