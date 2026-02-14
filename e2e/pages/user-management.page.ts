import type { Page, Locator } from '@playwright/test';

export class UserManagementPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;

  // Invite form
  readonly inviteButton: Locator;
  readonly inviteNameInput: Locator;
  readonly inviteEmailInput: Locator;
  readonly inviteRoleSelect: Locator;
  readonly submitInviteButton: Locator;

  // Users table
  readonly table: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Usuarios' });
    this.description = page.getByText('Gerencie os usuarios com acesso ao sistema');

    // Invite form
    this.inviteButton = page.getByRole('button', { name: 'Convidar Usuario' });
    this.inviteNameInput = page.locator('#invite-name');
    this.inviteEmailInput = page.locator('#invite-email');
    this.inviteRoleSelect = page.locator('#invite-role');
    this.submitInviteButton = page.getByRole('button', { name: 'Convidar' });

    // Users table
    this.table = page.locator('table');
    this.emptyState = page.getByText('Nenhum usuario encontrado');
  }

  async goto() {
    await this.page.goto('/configuracoes/usuarios');
  }

  async openInviteForm() {
    await this.inviteButton.click();
  }

  async fillInviteForm(data: { name: string; email: string }) {
    await this.inviteNameInput.fill(data.name);
    await this.inviteEmailInput.fill(data.email);
  }
}
