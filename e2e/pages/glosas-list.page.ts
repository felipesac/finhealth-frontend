import type { Page, Locator } from '@playwright/test';

export class GlosasListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;
  readonly table: Locator;
  readonly searchInput: Locator;
  readonly typeFilter: Locator;
  readonly emptyState: Locator;
  readonly pendingTab: Locator;
  readonly inProgressTab: Locator;
  readonly resolvedTab: Locator;
  readonly allTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Glosas' });
    this.description = page.getByText('Gerencie as glosas e recursos');
    this.table = page.locator('table');
    this.searchInput = page.getByPlaceholder('Buscar por codigo ou conta...');
    this.typeFilter = page.locator('button').filter({ hasText: /Tipo|Todos os Tipos/ }).first();
    this.emptyState = page.getByText('Nenhuma glosa encontrada');
    this.pendingTab = page.getByRole('link', { name: /Pendentes/ });
    this.inProgressTab = page.getByRole('link', { name: /Em Recurso/ });
    this.resolvedTab = page.getByRole('link', { name: /Resolvidas/ });
    this.allTab = page.getByRole('link', { name: /Todas/ });
  }

  async goto() {
    await this.page.goto('/glosas');
  }

  async gotoTab(tab: 'pending' | 'in_progress' | 'resolved' | 'all') {
    const tabMap = {
      pending: this.pendingTab,
      in_progress: this.inProgressTab,
      resolved: this.resolvedTab,
      all: this.allTab,
    };
    await tabMap[tab].click();
  }

  async searchByCode(code: string) {
    await this.searchInput.fill(code);
  }

  async getTableRows() {
    return this.table.locator('tbody tr');
  }

  async clickGlosaLink(code: string) {
    await this.page.getByRole('link', { name: code }).click();
  }
}
