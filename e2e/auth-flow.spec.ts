import { test, expect } from '@playwright/test';

test.describe('Auth Flow Integration', () => {
  test('login page has forgot password link', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.getByText('Esqueceu a senha?');
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test('forgot password page links back to login', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByText('Voltar ao login').click();
    await expect(page).toHaveURL(/.*login/);
  });

  test('protected routes redirect to login', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/contas',
      '/glosas',
      '/pagamentos',
      '/tiss',
      '/relatorios',
      '/configuracoes',
      '/admin/usuarios',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('login form validates email format', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Senha').fill('password123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Email invalido')).toBeVisible();
  });

  test('login form validates required password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@test.com');
    // Don't fill password
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Senha obrigatoria')).toBeVisible();
  });
});
