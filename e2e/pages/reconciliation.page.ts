import type { Page, Locator } from '@playwright/test';

export class ReconciliationPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;
  readonly table: Locator;
  readonly emptyState: Locator;
  readonly totalPaymentsCard: Locator;
  readonly matchedCard: Locator;
  readonly partialCard: Locator;
  readonly pendingCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Conciliacao Bancaria' });
    this.description = page.getByText('Listagem de conciliacoes bancarias');
    this.table = page.locator('table');
    this.emptyState = page.getByText('Nenhum pagamento encontrado');
    this.totalPaymentsCard = page.getByText('Total Pagamentos');
    this.matchedCard = page.getByText('Conciliados');
    this.partialCard = page.getByText('Parciais');
    this.pendingCard = page.getByText('Pendentes').first();
  }

  async goto() {
    await this.page.goto('/pagamentos/conciliacao');
  }

  async getTableRows() {
    return this.table.locator('tbody tr');
  }
}
