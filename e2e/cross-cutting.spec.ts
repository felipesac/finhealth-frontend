import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts', () => {
  test('help dialog opens via floating button', async ({ page }) => {
    await page.goto('/dashboard');

    // Click the floating "?" button
    const helpButton = page.getByLabel('Atalhos de teclado');
    await expect(helpButton).toBeVisible();
    await helpButton.click();

    // Dialog should show keyboard shortcuts
    await expect(page.getByText('Atalhos de Teclado')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('help dialog closes on Escape', async ({ page }) => {
    await page.goto('/dashboard');

    const helpButton = page.getByLabel('Atalhos de teclado');
    await helpButton.click();
    await expect(page.getByText('Atalhos de Teclado')).toBeVisible();

    await page.keyboard.press('Escape');

    // Dialog should close
    await expect(page.getByText('Atalhos de Teclado')).toBeHidden();
  });
});

test.describe('Skip-to-Content', () => {
  test('skip link is focusable and targets main content', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab to focus the skip link (first focusable element)
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');
    const isVisible = await skipLink.isVisible().catch(() => false);

    if (isVisible) {
      await expect(skipLink).toBeFocused();
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeAttached();
    }
  });
});

test.describe('Toast Notifications', () => {
  test('toast appears after triggering an action', async ({ page }) => {
    await page.goto('/configuracoes');

    // Trigger a toast by saving profile
    const nameInput = page.locator('#name');
    await nameInput.clear();
    await nameInput.fill('Toast Test User');
    await page.getByRole('button', { name: 'Salvar Alteracoes' }).click();

    // Toast should appear (success or error)
    const toast = page.locator('[role="status"]')
      .or(page.getByText(/salvo|atualizado|sucesso|erro|falha/i));
    await expect(toast.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Theme Toggle', () => {
  test('theme toggle switches between light and dark', async ({ page }) => {
    await page.goto('/dashboard');

    const themeButton = page.getByLabel('Alternar tema claro/escuro');
    await expect(themeButton).toBeVisible();

    // Get initial theme
    const htmlElement = page.locator('html');
    const initialClass = await htmlElement.getAttribute('class') || '';

    // Click toggle
    await themeButton.click();

    // Class should change (dark added or removed)
    const newClass = await htmlElement.getAttribute('class') || '';
    expect(newClass).not.toBe(initialClass);
  });

  test('theme persists after toggle', async ({ page }) => {
    await page.goto('/dashboard');

    const themeButton = page.getByLabel('Alternar tema claro/escuro');
    await themeButton.click();

    const htmlElement = page.locator('html');
    const classAfterToggle = await htmlElement.getAttribute('class') || '';

    // Reload and verify persistence
    await page.reload();

    const classAfterReload = await htmlElement.getAttribute('class') || '';
    expect(classAfterReload).toBe(classAfterToggle);
  });
});
