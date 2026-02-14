import type { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;

  // Profile card
  readonly profileCard: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly saveProfileButton: Locator;

  // Security card
  readonly securityCard: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly changePasswordButton: Locator;

  // Notifications card
  readonly notificationsCard: Locator;
  readonly glosasToggle: Locator;
  readonly pagamentosToggle: Locator;
  readonly contasToggle: Locator;
  readonly pushToggle: Locator;

  // TISS/SUS card
  readonly tissSusCard: Locator;
  readonly tissVersionInput: Locator;
  readonly cnesInput: Locator;
  readonly saveTissButton: Locator;

  // Certificate card
  readonly certificateCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Configuracoes' });
    this.description = page.getByText('Gerencie as configuracoes do sistema');

    // Profile
    this.profileCard = page.getByText('Perfil').first();
    this.nameInput = page.locator('#name');
    this.emailInput = page.locator('#email');
    this.saveProfileButton = page.getByRole('button', { name: 'Salvar Alteracoes' });

    // Security
    this.securityCard = page.getByText('Seguranca').first();
    this.currentPasswordInput = page.locator('#current-password');
    this.newPasswordInput = page.locator('#new-password');
    this.changePasswordButton = page.getByRole('button', { name: 'Alterar Senha' });

    // Notifications
    this.notificationsCard = page.getByText('Notificacoes').first();
    this.glosasToggle = page.locator('#notif-glosas');
    this.pagamentosToggle = page.locator('#notif-pagamentos');
    this.contasToggle = page.locator('#notif-contas');
    this.pushToggle = page.locator('#notif-push');

    // TISS/SUS
    this.tissSusCard = page.getByText('TISS / SUS').first();
    this.tissVersionInput = page.locator('#tiss-version');
    this.cnesInput = page.locator('#cnes');
    this.saveTissButton = page.getByRole('button', { name: 'Salvar Configuracoes TISS' });

    // Certificate
    this.certificateCard = page.getByText('Certificado Digital').first();
  }

  async goto() {
    await this.page.goto('/configuracoes');
  }

  async updateName(newName: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
    await this.saveProfileButton.click();
  }
}
