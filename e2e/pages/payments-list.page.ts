import type { Page, Locator } from '@playwright/test';

export class PaymentsListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;
  readonly table: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly emptyState: Locator;
  readonly totalReceivedCard: Locator;
  readonly matchedCard: Locator;
  readonly differenceCard: Locator;
  readonly pendingCard: Locator;
  readonly uploadCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Pagamentos' });
    this.description = page.getByText('Gestao de pagamentos recebidos e conciliacao bancaria');
    this.table = page.locator('table');
    this.searchInput = page.getByPlaceholder('Buscar por referencia...');
    this.statusFilter = page.locator('button').filter({ hasText: /Status|Todos/ }).first();
    this.emptyState = page.getByText('Nenhum pagamento encontrado');
    this.totalReceivedCard = page.getByText('Total Recebido');
    this.matchedCard = page.getByText('Conciliado').first();
    this.differenceCard = page.getByText('Diferenca').first();
    this.pendingCard = page.getByText('Pendentes').first();
    this.uploadCard = page.getByText('Importar Pagamentos');
  }

  async goto() {
    await this.page.goto('/pagamentos');
  }

  async searchByReference(reference: string) {
    await this.searchInput.fill(reference);
  }

  async getTableRows() {
    return this.table.locator('tbody tr');
  }

  async clickPaymentLink(reference: string) {
    await this.page.getByRole('link', { name: reference }).click();
  }
}
