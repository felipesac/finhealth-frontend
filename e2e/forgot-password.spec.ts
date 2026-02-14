import { test, expect } from '@playwright/test';

test.describe('Forgot Password Page', () => {
  test('shows forgot password form', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar link de recuperacao' })).toBeVisible();
  });

  test('has link back to login', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByText('Voltar ao login')).toBeVisible();
  });

  test('shows FinHealth branding', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByText('FinHealth')).toBeVisible();
    await expect(page.getByText('Sistema de Gestao Financeira Hospitalar')).toBeVisible();
  });
});
