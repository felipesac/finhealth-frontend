import type { Page, Locator } from '@playwright/test';

export class SidebarPage {
  readonly page: Page;
  readonly nav: Locator;
  readonly toggleButton: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = page.locator('aside nav');
    this.toggleButton = page.locator('aside button').first();
    this.logo = page.locator('aside').getByText('FinHealth');
  }

  async navigateTo(label: string) {
    await this.nav.getByText(label, { exact: true }).click();
  }

  async getNavLink(label: string): Promise<Locator> {
    return this.nav.getByText(label, { exact: true });
  }

  async toggle() {
    await this.toggleButton.click();
  }
}
