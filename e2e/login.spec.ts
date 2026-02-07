import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('shows login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('shows validation error for invalid email', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Senha').fill('password123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Email invalido')).toBeVisible();
  });

  test('shows validation error for empty password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@test.com');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Senha obrigatoria')).toBeVisible();
  });

  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});
