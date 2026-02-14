import type { Page, Locator } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly header: Locator;
  readonly systemName: Locator;
  readonly mobileMenuButton: Locator;
  readonly themeToggle: Locator;
  readonly userMenuButton: Locator;
  readonly notificationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByRole('banner');
    this.systemName = page.getByText('Sistema de Gestao Financeira');
    this.mobileMenuButton = page.getByLabel('Abrir menu');
    this.themeToggle = page.getByLabel('Alternar tema claro/escuro');
    this.userMenuButton = page.getByLabel('Menu do usuario');
    this.notificationButton = page.locator('button', { has: page.locator('svg.lucide-bell') });
  }

  async openUserMenu() {
    await this.userMenuButton.click();
  }

  async clickProfile() {
    await this.openUserMenu();
    await this.page.getByText('Perfil').click();
  }

  async clickLogout() {
    await this.openUserMenu();
    await this.page.getByText('Sair').click();
  }
}
