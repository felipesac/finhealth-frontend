import type { Page, Locator } from '@playwright/test';

export class SusBpaPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;
  readonly backButton: Locator;

  // Summary cards
  readonly totalBpasCard: Locator;
  readonly procedimentosCard: Locator;
  readonly valorTotalCard: Locator;

  // Form
  readonly formTitle: Locator;
  readonly cnesInput: Locator;
  readonly competenciaInput: Locator;
  readonly cboInput: Locator;
  readonly procedimentoInput: Locator;
  readonly quantidadeInput: Locator;
  readonly cnpjInput: Locator;
  readonly submitButton: Locator;

  // Table
  readonly table: Locator;
  readonly tableTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'BPA - Producao Ambulatorial' });
    this.description = page.getByText('Boletim de Producao Ambulatorial SUS');
    this.backButton = page.getByRole('link', { name: '' }).filter({ has: page.locator('svg.lucide-arrow-left') });

    // Summary cards
    this.totalBpasCard = page.getByText('Total BPAs');
    this.procedimentosCard = page.getByText('Procedimentos');
    this.valorTotalCard = page.getByText('Valor Total');

    // Form fields
    this.formTitle = page.getByText('Novo BPA');
    this.cnesInput = page.locator('#cnes');
    this.competenciaInput = page.locator('#competencia');
    this.cboInput = page.locator('#cbo');
    this.procedimentoInput = page.locator('#procedimento');
    this.quantidadeInput = page.locator('#quantidade');
    this.cnpjInput = page.locator('#cnpj_prestador');
    this.submitButton = page.getByRole('button', { name: 'Salvar BPA' });

    // Table
    this.table = page.locator('table');
    this.tableTitle = page.getByText('BPAs Registrados');
  }

  async goto() {
    await this.page.goto('/sus/bpa');
  }

  async fillRequiredFields(data: {
    cnes: string;
    competencia: string;
    cbo: string;
    procedimento: string;
    quantidade: string;
  }) {
    await this.cnesInput.fill(data.cnes);
    await this.competenciaInput.fill(data.competencia);
    await this.cboInput.fill(data.cbo);
    await this.procedimentoInput.fill(data.procedimento);
    await this.quantidadeInput.fill(data.quantidade);
  }
}
