import type { Page, Locator } from '@playwright/test';

export class TissListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;
  readonly uploadButton: Locator;
  readonly table: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'TISS' });
    this.description = page.getByText('Gerencie as guias TISS e uploads de XML');
    this.uploadButton = page.getByRole('link', { name: 'Upload XML' });
    this.table = page.locator('table');
    this.emptyState = page.getByText('Nenhuma guia TISS encontrada');
  }

  async goto() {
    await this.page.goto('/tiss');
  }

  async getTableRows() {
    return this.table.locator('tbody tr');
  }
}
