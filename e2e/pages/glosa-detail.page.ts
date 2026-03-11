import type { Page, Locator } from '@playwright/test';

export class GlosaDetailPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly infoCard: Locator;
  readonly valuesCard: Locator;
  readonly aiRecommendation: Locator;
  readonly appealTextarea: Locator;
  readonly saveDraftButton: Locator;
  readonly submitAppealButton: Locator;
  readonly statusBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.locator('a[href="/glosas"], button').filter({ has: page.locator('svg.lucide-arrow-left') }).first();
    this.infoCard = page.getByText('Informacoes da Glosa').locator('..');
    this.valuesCard = page.getByText('Valores').locator('..');
    this.aiRecommendation = page.getByText('Recomendacao da IA').locator('..');
    this.appealTextarea = page.getByPlaceholder('Digite a fundamentacao do recurso...');
    this.saveDraftButton = page.getByRole('button', { name: 'Salvar Rascunho' });
    this.submitAppealButton = page.getByRole('button', { name: 'Enviar Recurso' });
    this.statusBadge = page.locator('[class*="badge"]').first();
  }

  async goto(id: string) {
    await this.page.goto(`/glosas/${id}`);
  }

  async fillAppealText(text: string) {
    await this.appealTextarea.fill(text);
  }

  async saveDraft() {
    await this.saveDraftButton.click();
  }

  async submitAppeal() {
    await this.submitAppealButton.click();
  }

  async confirmSubmit() {
    await this.page.getByRole('button', { name: 'Confirmar Envio' }).click();
  }
}
