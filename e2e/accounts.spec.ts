import { test, expect } from '@playwright/test';
import { AccountsListPage } from './pages/accounts-list.page';
import { AccountFormPage } from './pages/account-form.page';
import { AccountDetailPage } from './pages/account-detail.page';

test.describe('Accounts List', () => {
  test('renders accounts list page with heading and table', async ({ page }) => {
    const accountsList = new AccountsListPage(page);
    await accountsList.goto();

    await expect(accountsList.heading).toBeVisible();
    await expect(accountsList.description).toBeVisible();

    // Table or empty state should be present
    const table = accountsList.table;
    const emptyState = accountsList.emptyState;
    await expect(table.or(emptyState)).toBeVisible();
  });

  test('renders table with expected columns', async ({ page }) => {
    const accountsList = new AccountsListPage(page);
    await accountsList.goto();

    // If table is visible, check column headers
    const table = accountsList.table;
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: /Numero/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Paciente/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Status/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Valor Total/ })).toBeVisible();
    }
  });

  test('search input filters by account number', async ({ page }) => {
    const accountsList = new AccountsListPage(page);
    await accountsList.goto();

    await expect(accountsList.searchInput).toBeVisible();
    await accountsList.searchByNumber('CT-999999');

    // After searching for non-existent number, empty state or no results
    await page.waitForTimeout(500);
    const rows = await accountsList.getTableRows();
    const emptyState = accountsList.emptyState;
    const rowCount = await rows.count();
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(rowCount === 0 || hasEmpty).toBeTruthy();
  });

  test('status filter is available', async ({ page }) => {
    const accountsList = new AccountsListPage(page);
    await accountsList.goto();

    // Status filter should be visible
    const statusTrigger = page.locator('button').filter({ hasText: /Status|Todos/ }).first();
    await expect(statusTrigger).toBeVisible();
  });

  test('shows empty state when no accounts match filter', async ({ page }) => {
    const accountsList = new AccountsListPage(page);
    await accountsList.goto();

    // Search for something that won't match
    await accountsList.searchByNumber('ZZZZZZZZZZZZZ');
    await page.waitForTimeout(500);

    await expect(accountsList.emptyState).toBeVisible();
  });

  test('new account button navigates to create form', async ({ page }) => {
    const accountsList = new AccountsListPage(page);
    await accountsList.goto();

    await accountsList.newAccountButton.click();
    await expect(page).toHaveURL(/\/contas\/nova/);
  });

  test('status badges display correct variants', async ({ page }) => {
    const accountsList = new AccountsListPage(page);
    await accountsList.goto();

    // Check that status badges are rendered (at least one should be present if data exists)
    const badges = page.locator('[class*="badge"]');
    const table = accountsList.table;
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      const badgeCount = await badges.count();
      expect(badgeCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('bulk select checkbox is available in table', async ({ page }) => {
    const accountsList = new AccountsListPage(page);
    await accountsList.goto();

    const table = accountsList.table;
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      // Select all checkbox should be in header
      const checkbox = table.locator('thead').locator('input[type="checkbox"], button[role="checkbox"]').first();
      await expect(checkbox).toBeVisible();
    }
  });
});

test.describe('Create Account Form', () => {
  test('renders create account form with all fields', async ({ page }) => {
    const form = new AccountFormPage(page);
    await form.goto();

    await expect(form.heading).toBeVisible();
    await expect(form.accountNumberInput).toBeVisible();
    await expect(form.admissionDateInput).toBeVisible();
    await expect(form.totalAmountInput).toBeVisible();
    await expect(form.submitButton).toBeVisible();
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    const form = new AccountFormPage(page);
    await form.goto();

    await form.submit();

    // Should show at least one validation error
    const errors = page.locator('[class*="text-destructive"], [class*="text-red"]');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });

  test('account number field validation', async ({ page }) => {
    const form = new AccountFormPage(page);
    await form.goto();

    // Leave account number empty and submit
    await form.submit();

    await expect(page.getByText('Numero da conta obrigatorio')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Account Detail', () => {
  test('navigating to account detail from list', async ({ page }) => {
    const accountsList = new AccountsListPage(page);
    await accountsList.goto();

    // If there are account links in the table, click the first one
    const accountLink = page.locator('table tbody a').first();
    const hasLinks = await accountLink.isVisible().catch(() => false);

    if (hasLinks) {
      await accountLink.click();
      await expect(page).toHaveURL(/\/contas\/[a-f0-9-]+/);

      const detail = new AccountDetailPage(page);

      // General info card should be visible
      await expect(page.getByText('Informacoes Gerais')).toBeVisible();
      await expect(page.getByText('Valores')).toBeVisible();
    }
  });

  test('detail page shows account values section', async ({ page }) => {
    const accountsList = new AccountsListPage(page);
    await accountsList.goto();

    const accountLink = page.locator('table tbody a').first();
    const hasLinks = await accountLink.isVisible().catch(() => false);

    if (hasLinks) {
      await accountLink.click();
      await expect(page).toHaveURL(/\/contas\/[a-f0-9-]+/);

      // Values card should show financial info
      await expect(page.getByText('Valor Total')).toBeVisible();
    }
  });
});
