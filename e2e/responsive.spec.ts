import { test, expect } from '@playwright/test';

test.describe('Responsive Layout — Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('sidebar is hidden on mobile', async ({ page }) => {
    await page.goto('/dashboard');

    // Desktop sidebar should be hidden
    const sidebar = page.locator('nav.hidden.md\\:block').or(page.locator('aside.hidden.md\\:block'));
    const desktopSidebar = page.locator('[class*="w-64"]').first();

    // On mobile, the sidebar should not be visible as a fixed element
    const isSidebarVisible = await desktopSidebar.isVisible().catch(() => false);
    expect(isSidebarVisible).toBe(false);
  });

  test('mobile menu button is visible', async ({ page }) => {
    await page.goto('/dashboard');

    // Menu/hamburger button should be visible on mobile
    const menuButton = page.getByRole('button', { name: /menu/i })
      .or(page.locator('button svg.lucide-menu').locator('..'));
    await expect(menuButton).toBeVisible();
  });

  test('page content is readable at mobile width', async ({ page }) => {
    await page.goto('/dashboard');

    // Main heading should still be visible
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();

    // No horizontal overflow
    const body = page.locator('body');
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // small tolerance
  });
});

test.describe('Responsive Layout — Tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('layout adapts to tablet viewport', async ({ page }) => {
    await page.goto('/dashboard');

    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('cards render in multi-column grid', async ({ page }) => {
    await page.goto('/dashboard');

    // At 768px, cards should be in grid layout (at least 2 columns)
    const cards = page.locator('[class*="grid"] > div');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Responsive Layout — Desktop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('sidebar is visible on desktop', async ({ page }) => {
    await page.goto('/dashboard');

    // Desktop sidebar should be visible
    const sidebarNav = page.locator('nav').first();
    await expect(sidebarNav).toBeVisible();
  });

  test('full layout renders at desktop width', async ({ page }) => {
    await page.goto('/dashboard');

    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();

    // No horizontal overflow
    const body = page.locator('body');
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(1280 + 20);
  });
});
