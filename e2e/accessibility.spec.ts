import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('login page has proper form labels', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Senha');
    const submitButton = page.getByRole('button', { name: 'Entrar' });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Check autocomplete attributes
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });

  test('forgot password page has proper form labels', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'email');
  });

  test('reset password page has proper form labels', async ({ page }) => {
    await page.goto('/reset-password');
    const newPassword = page.getByLabel('Nova senha');
    const confirmPassword = page.getByLabel('Confirmar nova senha');

    await expect(newPassword).toBeVisible();
    await expect(confirmPassword).toBeVisible();
    await expect(newPassword).toHaveAttribute('autocomplete', 'new-password');
    await expect(confirmPassword).toHaveAttribute('autocomplete', 'new-password');
  });

  test('error messages have alert role', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('invalid');
    await page.getByLabel('Senha').fill('pass');
    await page.getByRole('button', { name: 'Entrar' }).click();

    const alert = page.locator('[role="alert"]');
    await expect(alert.first()).toBeVisible();
  });

  test('login page has page title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/FinHealth/);
  });
});
