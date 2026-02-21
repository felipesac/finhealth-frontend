import type { Page, Locator } from '@playwright/test';

export class AccountFormPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly accountNumberInput: Locator;
  readonly typeSelect: Locator;
  readonly patientSelect: Locator;
  readonly insurerSelect: Locator;
  readonly admissionDateInput: Locator;
  readonly dischargeDateInput: Locator;
  readonly totalAmountInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Nova Conta Medica' });
    this.accountNumberInput = page.getByLabel('Numero da Conta');
    this.typeSelect = page.getByLabel('Tipo');
    this.patientSelect = page.getByLabel('Paciente');
    this.insurerSelect = page.getByLabel('Operadora');
    this.admissionDateInput = page.getByLabel('Data de Admissao');
    this.dischargeDateInput = page.getByLabel('Data de Alta');
    this.totalAmountInput = page.getByLabel('Valor Total (R$)');
    this.submitButton = page.getByRole('button', { name: 'Salvar Conta' });
  }

  async goto() {
    await this.page.goto('/contas/nova');
  }

  async fillForm(data: {
    accountNumber: string;
    type?: string;
    admissionDate: string;
    totalAmount: string;
  }) {
    await this.accountNumberInput.fill(data.accountNumber);
    if (data.type) {
      await this.typeSelect.click();
      await this.page.getByRole('option', { name: data.type }).click();
    }
    await this.admissionDateInput.fill(data.admissionDate);
    await this.totalAmountInput.fill(data.totalAmount);
  }

  async submit() {
    await this.submitButton.click();
  }

  async getValidationError(fieldName: string) {
    return this.page.getByText(fieldName);
  }
}
