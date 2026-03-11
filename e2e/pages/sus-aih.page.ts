import type { Page, Locator } from '@playwright/test';

export class SusAihPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;
  readonly backButton: Locator;

  // Summary cards
  readonly totalAihsCard: Locator;
  readonly diariasCard: Locator;
  readonly valorTotalCard: Locator;

  // Form
  readonly formTitle: Locator;
  readonly numeroAihInput: Locator;
  readonly tipoAihSelect: Locator;
  readonly cnesInput: Locator;
  readonly procedimentoPrincipalInput: Locator;
  readonly procedimentoSecundarioInput: Locator;
  readonly cboMedicoInput: Locator;
  readonly dataInternacaoInput: Locator;
  readonly dataSaidaInput: Locator;
  readonly valorInput: Locator;
  readonly submitButton: Locator;

  // Table
  readonly table: Locator;
  readonly tableTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'AIH - Internacoes' });
    this.description = page.getByText('Autorizacao de Internacao Hospitalar SUS');
    this.backButton = page.getByRole('link', { name: '' }).filter({ has: page.locator('svg.lucide-arrow-left') });

    // Summary cards
    this.totalAihsCard = page.getByText('Total AIHs');
    this.diariasCard = page.getByText('Diarias');
    this.valorTotalCard = page.getByText('Valor Total');

    // Form fields
    this.formTitle = page.getByText('Nova AIH');
    this.numeroAihInput = page.locator('#numero_aih');
    this.tipoAihSelect = page.locator('#tipo_aih');
    this.cnesInput = page.locator('#cnes');
    this.procedimentoPrincipalInput = page.locator('#procedimento_principal');
    this.procedimentoSecundarioInput = page.locator('#procedimento_secundario');
    this.cboMedicoInput = page.locator('#cbo_medico');
    this.dataInternacaoInput = page.locator('#data_internacao');
    this.dataSaidaInput = page.locator('#data_saida');
    this.valorInput = page.locator('#valor');
    this.submitButton = page.getByRole('button', { name: 'Salvar AIH' });

    // Table
    this.table = page.locator('table');
    this.tableTitle = page.getByText('AIHs Registradas');
  }

  async goto() {
    await this.page.goto('/sus/aih');
  }

  async fillRequiredFields(data: {
    numeroAih: string;
    cnes: string;
    procedimentoPrincipal: string;
    dataInternacao: string;
    valor: string;
  }) {
    await this.numeroAihInput.fill(data.numeroAih);
    await this.cnesInput.fill(data.cnes);
    await this.procedimentoPrincipalInput.fill(data.procedimentoPrincipal);
    await this.dataInternacaoInput.fill(data.dataInternacao);
    await this.valorInput.fill(data.valor);
  }
}
