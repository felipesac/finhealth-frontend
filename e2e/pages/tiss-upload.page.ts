import type { Page, Locator } from '@playwright/test';

export class TissUploadPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;
  readonly backButton: Locator;
  readonly accountSelect: Locator;
  readonly dropzone: Locator;
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly progressBar: Locator;
  readonly validationSuccess: Locator;
  readonly validationError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Upload de Guia TISS' });
    this.description = page.getByText('Envie um arquivo XML para validacao');
    this.backButton = page.getByRole('link', { name: '' }).filter({ has: page.locator('svg.lucide-arrow-left') });
    this.accountSelect = page.getByText('Selecione a conta medica');
    this.dropzone = page.getByText('Arraste um arquivo XML ou clique para selecionar');
    this.fileInput = page.locator('input[type="file"]');
    this.uploadButton = page.getByRole('button', { name: /Validar e Enviar|Processando/ });
    this.progressBar = page.getByLabel('Progresso do upload');
    this.validationSuccess = page.getByText('Validacao concluida com sucesso');
    this.validationError = page.getByText('Erros encontrados na validacao');
  }

  async goto() {
    await this.page.goto('/tiss/upload');
  }

  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }
}
