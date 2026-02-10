import type { Page, Locator } from '@playwright/test';

export class AccountsListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;
  readonly newAccountButton: Locator;
  readonly table: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly typeFilter: Locator;
  readonly insurerFilter: Locator;
  readonly emptyState: Locator;
  readonly selectAllCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Contas Medicas' });
    this.description = page.getByText('Gerencie as contas medicas e guias TISS');
    this.newAccountButton = page.getByRole('link', { name: 'Nova Conta' });
    this.table = page.locator('table');
    this.searchInput = page.getByPlaceholder('Buscar por numero...');
    this.statusFilter = page.locator('button', { hasText: 'Status' }).first();
    this.typeFilter = page.locator('button', { hasText: 'Tipo' }).first();
    this.insurerFilter = page.locator('button', { hasText: 'Operadora' }).first();
    this.emptyState = page.getByText('Nenhuma conta encontrada');
    this.selectAllCheckbox = page.locator('table thead input[type="checkbox"]');
  }

  async goto() {
    await this.page.goto('/contas');
  }

  async searchByNumber(number: string) {
    await this.searchInput.fill(number);
  }

  async filterByStatus(status: string) {
    await this.statusFilter.click();
    await this.page.getByRole('option', { name: status }).click();
  }

  async getTableRows() {
    return this.table.locator('tbody tr');
  }

  async getAccountCard() {
    return this.page.locator('[data-testid="account-card"]');
  }

  async clickAccountLink(accountNumber: string) {
    await this.page.getByRole('link', { name: accountNumber }).click();
  }
}
