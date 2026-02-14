import type { Page, Locator } from '@playwright/test';

export class AccountDetailPage {
  readonly page: Page;
  readonly generalInfoCard: Locator;
  readonly valuesCard: Locator;
  readonly tissCard: Locator;
  readonly statusBadge: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.generalInfoCard = page.getByText('Informacoes Gerais').locator('..');
    this.valuesCard = page.getByText('Valores').locator('..');
    this.tissCard = page.getByText('Guia TISS').locator('..');
    this.statusBadge = page.locator('[class*="badge"]').first();
    this.backButton = page.locator('a[href="/contas"]').first();
  }

  async goto(id: string) {
    await this.page.goto(`/contas/${id}`);
  }

  async getFieldValue(label: string) {
    return this.page.getByText(label).locator('..').locator('dd, p, span').last();
  }
}
