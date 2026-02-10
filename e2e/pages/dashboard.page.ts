import type { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly metricCards: Locator;
  readonly recentAccountsTable: Locator;
  readonly chartsContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
    this.metricCards = page.locator('[class*="card"]');
    this.recentAccountsTable = page.locator('table');
    this.chartsContainer = page.locator('.recharts-responsive-container');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async getMetricByTitle(title: string) {
    return this.page.getByText(title);
  }
}
