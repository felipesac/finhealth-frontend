import { test, expect } from '@playwright/test';
import { SidebarPage } from './pages/sidebar.page';
import { HeaderPage } from './pages/header.page';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('navigates to contas', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateTo('Contas Medicas');
    await expect(page).toHaveURL(/\/contas/);
  });

  test('navigates to glosas', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateTo('Glosas');
    await expect(page).toHaveURL(/\/glosas/);
  });

  test('navigates to pagamentos', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateTo('Pagamentos');
    await expect(page).toHaveURL(/\/pagamentos/);
  });

  test('navigates to tiss', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateTo('TISS');
    await expect(page).toHaveURL(/\/tiss/);
  });

  test('navigates to sus', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateTo('SUS');
    await expect(page).toHaveURL(/\/sus/);
  });

  test('navigates to relatorios', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateTo('Relatorios');
    await expect(page).toHaveURL(/\/relatorios/);
  });

  test('navigates to configuracoes', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.navigateTo('Configuracoes');
    await expect(page).toHaveURL(/\/configuracoes/);
  });

  test('sidebar collapse and expand toggle', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    // Sidebar should be expanded by default — logo visible
    await expect(sidebar.logo).toBeVisible();

    // Click collapse
    const collapseButton = page.getByLabel('Recolher menu lateral');
    await collapseButton.click();

    // After collapse, expand button should appear
    const expandButton = page.getByLabel('Expandir menu lateral');
    await expect(expandButton).toBeVisible();

    // Expand again
    await expandButton.click();
    await expect(sidebar.logo).toBeVisible();
  });
});

test.describe('Breadcrumbs', () => {
  test('renders breadcrumbs on sub-pages', async ({ page }) => {
    await page.goto('/contas');

    const breadcrumbNav = page.getByLabel('Breadcrumb');
    await expect(breadcrumbNav).toBeVisible();

    // Should show "Contas Medicas" as current page
    await expect(breadcrumbNav.getByText('Contas Medicas')).toBeVisible();
  });

  test('breadcrumbs not shown on dashboard root', async ({ page }) => {
    await page.goto('/dashboard');

    const breadcrumbNav = page.getByLabel('Breadcrumb');
    await expect(breadcrumbNav).not.toBeVisible();
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('mobile menu opens and closes', async ({ page }) => {
    await page.goto('/dashboard');
    const header = new HeaderPage(page);

    // Mobile menu button should be visible
    await expect(header.mobileMenuButton).toBeVisible();

    // Open mobile menu
    await header.mobileMenuButton.click();

    // Navigation items should appear in the drawer
    await expect(page.getByText('Contas Medicas')).toBeVisible();
    await expect(page.getByText('Glosas')).toBeVisible();
  });
});

test.describe('User Menu', () => {
  test('user menu shows profile and logout options', async ({ page }) => {
    await page.goto('/dashboard');
    const header = new HeaderPage(page);

    await expect(header.userMenuButton).toBeVisible();
    await header.openUserMenu();

    // Should show Conta label, Perfil, and Sair
    await expect(page.getByText('Conta')).toBeVisible();
    await expect(page.getByText('Perfil')).toBeVisible();
    await expect(page.getByText('Sair')).toBeVisible();
  });

  test('logout returns to login page', async ({ page }) => {
    await page.goto('/dashboard');
    const header = new HeaderPage(page);

    await header.clickLogout();

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });
});
