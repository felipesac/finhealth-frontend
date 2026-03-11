import type { Page, Locator } from '@playwright/test';

export class ReportsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;

  // Navigation cards
  readonly faturamentoCard: Locator;
  readonly glossasOperadoraCard: Locator;
  readonly tendenciasCard: Locator;
  readonly producaoCard: Locator;
  readonly exportarCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Relatorios' });
    this.description = page.getByText('Acesse relatorios e analises financeiras');

    // Navigation cards (links)
    this.faturamentoCard = page.getByRole('link', { name: /Faturamento Mensal/ });
    this.glossasOperadoraCard = page.getByRole('link', { name: /Glosas por Operadora/ });
    this.tendenciasCard = page.getByRole('link', { name: /Tendencias/ });
    this.producaoCard = page.getByRole('link', { name: /Producao Medica/ });
    this.exportarCard = page.getByRole('link', { name: /Exportar Dados/ });
  }

  async goto() {
    await this.page.goto('/relatorios');
  }
}

export class ExportPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;
  readonly backButton: Locator;

  // Data type checkboxes
  readonly contasMedicasCheckbox: Locator;
  readonly glosasCheckbox: Locator;
  readonly pagamentosCheckbox: Locator;
  readonly pacientesCheckbox: Locator;
  readonly operadorasCheckbox: Locator;

  // Date range
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;

  // Export
  readonly exportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Exportar Dados' });
    this.description = page.getByText('Exporte dados do sistema para Excel ou PDF');
    this.backButton = page.getByRole('link', { name: '' }).filter({ has: page.locator('svg.lucide-arrow-left') });

    // Data type checkboxes
    this.contasMedicasCheckbox = page.getByLabel('Contas Medicas');
    this.glosasCheckbox = page.getByLabel('Glosas');
    this.pagamentosCheckbox = page.getByLabel('Pagamentos');
    this.pacientesCheckbox = page.getByLabel('Pacientes');
    this.operadorasCheckbox = page.getByLabel('Operadoras');

    // Date range
    this.dateFromInput = page.locator('#date-from');
    this.dateToInput = page.locator('#date-to');

    // Export button
    this.exportButton = page.getByRole('button', { name: /Exportar Dados/ });
  }

  async goto() {
    await this.page.goto('/relatorios/exportar');
  }
}
