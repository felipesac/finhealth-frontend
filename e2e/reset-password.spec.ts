import { test, expect } from '@playwright/test';

test.describe('Reset Password Page', () => {
  test('shows reset password form', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: 'Redefinir senha' })).toBeVisible();
    await expect(page.getByLabel('Nova senha')).toBeVisible();
    await expect(page.getByLabel('Confirmar nova senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Redefinir senha' })).toBeVisible();
  });

  test('shows validation error for short password', async ({ page }) => {
    await page.goto('/reset-password');
    await page.getByLabel('Nova senha').fill('123');
    await page.getByLabel('Confirmar nova senha').fill('123');
    await page.getByRole('button', { name: 'Redefinir senha' }).click();
    await expect(page.getByText('A senha deve ter pelo menos 6 caracteres')).toBeVisible();
  });

  test('shows validation error for mismatched passwords', async ({ page }) => {
    await page.goto('/reset-password');
    await page.getByLabel('Nova senha').fill('password123');
    await page.getByLabel('Confirmar nova senha').fill('differentpassword');
    await page.getByRole('button', { name: 'Redefinir senha' }).click();
    await expect(page.getByText('As senhas nao coincidem')).toBeVisible();
  });
});
