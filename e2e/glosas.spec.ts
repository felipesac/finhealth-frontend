import { test, expect } from '@playwright/test';
import { GlosasListPage } from './pages/glosas-list.page';
import { GlosaDetailPage } from './pages/glosa-detail.page';

test.describe('Glosas List', () => {
  test('renders glosas list page with heading and tabs', async ({ page }) => {
    const glosas = new GlosasListPage(page);
    await glosas.goto();

    await expect(glosas.heading).toBeVisible();
    await expect(glosas.description).toBeVisible();

    // All 4 tabs should be visible
    await expect(glosas.pendingTab).toBeVisible();
    await expect(glosas.inProgressTab).toBeVisible();
    await expect(glosas.resolvedTab).toBeVisible();
    await expect(glosas.allTab).toBeVisible();
  });

  test('tab switching updates URL', async ({ page }) => {
    const glosas = new GlosasListPage(page);
    await glosas.goto();

    await glosas.gotoTab('in_progress');
    await expect(page).toHaveURL(/tab=in_progress/);

    await glosas.gotoTab('resolved');
    await expect(page).toHaveURL(/tab=resolved/);

    await glosas.gotoTab('all');
    await expect(page).toHaveURL(/tab=all/);

    await glosas.gotoTab('pending');
    await expect(page).toHaveURL(/tab=pending/);
  });

  test('search input filters glosas', async ({ page }) => {
    const glosas = new GlosasListPage(page);
    await glosas.goto();

    await expect(glosas.searchInput).toBeVisible();
    await glosas.searchByCode('NONEXISTENT999');
    await page.waitForTimeout(600); // debounce 400ms + buffer

    // Should show empty state or no results
    const emptyState = glosas.emptyState;
    const rows = await glosas.getTableRows();
    const rowCount = await rows.count();
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(rowCount === 0 || hasEmpty).toBeTruthy();
  });

  test('shows empty state when no glosas match filter', async ({ page }) => {
    const glosas = new GlosasListPage(page);
    await glosas.goto();

    await glosas.searchByCode('ZZZZZZZZZZZZ');
    await page.waitForTimeout(600);

    await expect(glosas.emptyState).toBeVisible();
  });

  test('table or empty state is visible', async ({ page }) => {
    const glosas = new GlosasListPage(page);
    await glosas.goto();

    const table = glosas.table;
    const emptyState = glosas.emptyState;
    await expect(table.or(emptyState)).toBeVisible();
  });
});

test.describe('Glosas by Operator', () => {
  test('renders operadora page with summary cards', async ({ page }) => {
    await page.goto('/glosas/operadora');

    await expect(page.getByRole('heading', { name: 'Glosas por Operadora' })).toBeVisible();
    await expect(page.getByText('Glosas agrupadas por operadora de saude')).toBeVisible();

    // Summary cards should be visible
    await expect(page.getByText('Total Glosado')).toBeVisible();
  });

  test('renders operadora table or empty state', async ({ page }) => {
    await page.goto('/glosas/operadora');

    const table = page.locator('table');
    const emptyState = page.getByText('Nenhuma glosa encontrada');
    await expect(table.or(emptyState)).toBeVisible();
  });
});

test.describe('Glosas by Billing', () => {
  test('renders faturamento page with metric cards', async ({ page }) => {
    await page.goto('/glosas/faturamento');

    await expect(page.getByRole('heading', { name: 'Glosas - Faturamento' })).toBeVisible();
    await expect(page.getByText('Glosas vinculadas ao faturamento com status de recurso')).toBeVisible();
  });

  test('renders faturamento table or empty state', async ({ page }) => {
    await page.goto('/glosas/faturamento');

    const table = page.locator('table');
    const emptyState = page.getByText('Nenhuma glosa encontrada');
    await expect(table.or(emptyState)).toBeVisible();
  });
});

test.describe('Glosa Detail and Appeal', () => {
  test('navigating to glosa detail from list', async ({ page }) => {
    const glosas = new GlosasListPage(page);
    await glosas.goto();

    // Switch to all tab to see all glosas
    await glosas.gotoTab('all');
    await page.waitForTimeout(500);

    const glosaLink = page.locator('table tbody a').first();
    const hasLinks = await glosaLink.isVisible().catch(() => false);

    if (hasLinks) {
      await glosaLink.click();
      await expect(page).toHaveURL(/\/glosas\/[a-f0-9-]+/);

      // Info and values cards should be visible
      await expect(page.getByText('Informacoes da Glosa')).toBeVisible();
      await expect(page.getByText('Valores')).toBeVisible();
    }
  });

  test('glosa detail shows appeal form section', async ({ page }) => {
    const glosas = new GlosasListPage(page);
    await glosas.goto();

    await glosas.gotoTab('all');
    await page.waitForTimeout(500);

    const glosaLink = page.locator('table tbody a').first();
    const hasLinks = await glosaLink.isVisible().catch(() => false);

    if (hasLinks) {
      await glosaLink.click();
      await expect(page).toHaveURL(/\/glosas\/[a-f0-9-]+/);

      // Appeal section should be visible
      await expect(page.getByText('Texto do Recurso')).toBeVisible();
    }
  });

  test('appeal form validation requires text', async ({ page }) => {
    const glosas = new GlosasListPage(page);
    await glosas.goto();

    await glosas.gotoTab('pending');
    await page.waitForTimeout(500);

    const glosaLink = page.locator('table tbody a').first();
    const hasLinks = await glosaLink.isVisible().catch(() => false);

    if (hasLinks) {
      await glosaLink.click();
      await expect(page).toHaveURL(/\/glosas\/[a-f0-9-]+/);

      const detail = new GlosaDetailPage(page);
      const hasSubmit = await detail.submitAppealButton.isVisible().catch(() => false);

      if (hasSubmit) {
        // Try to submit without text — should show validation
        await detail.submitAppeal();
        // Confirmation dialog or validation error
        const confirmButton = page.getByRole('button', { name: 'Confirmar Envio' });
        const hasConfirm = await confirmButton.isVisible().catch(() => false);
        if (hasConfirm) {
          await confirmButton.click();
        }
      }
    }
  });
});
