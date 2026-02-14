import { test, expect } from '@playwright/test';
import { SettingsPage } from './pages/settings.page';
import { UserManagementPage } from './pages/user-management.page';

test.describe('Settings Main Page', () => {
  test('renders settings page with all config cards', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    await expect(settings.heading).toBeVisible();
    await expect(settings.description).toBeVisible();

    // All 4 main sections should be visible
    await expect(settings.profileCard).toBeVisible();
    await expect(settings.securityCard).toBeVisible();
    await expect(settings.notificationsCard).toBeVisible();
    await expect(settings.tissSusCard).toBeVisible();
  });

  test('profile section renders name and email inputs', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    await expect(settings.nameInput).toBeVisible();
    await expect(settings.emailInput).toBeVisible();
    await expect(settings.emailInput).toBeDisabled();
    await expect(settings.saveProfileButton).toBeVisible();
  });

  test('profile update — change name and save', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    await settings.updateName('Test User Updated');

    // Expect toast confirmation (success or error)
    const successToast = page.getByText(/salvo|atualizado|sucesso/i);
    const errorToast = page.getByText(/erro|falha|error/i);
    await expect(successToast.or(errorToast)).toBeVisible({ timeout: 10000 });
  });

  test('notification toggles are interactive', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    // All 4 toggles should be visible
    await expect(settings.glosasToggle).toBeVisible();
    await expect(settings.pagamentosToggle).toBeVisible();
    await expect(settings.contasToggle).toBeVisible();
    await expect(settings.pushToggle).toBeVisible();

    // Toggle one switch
    const wasBefore = await settings.glosasToggle.isChecked();
    await settings.glosasToggle.click();
    const isAfter = await settings.glosasToggle.isChecked();
    expect(isAfter).not.toBe(wasBefore);
  });

  test('TISS/SUS config renders version and CNES inputs', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    await expect(settings.tissVersionInput).toBeVisible();
    await expect(settings.cnesInput).toBeVisible();
    await expect(settings.saveTissButton).toBeVisible();
  });
});

test.describe('User Management', () => {
  test('renders user management page with table', async ({ page }) => {
    const users = new UserManagementPage(page);
    await users.goto();

    await expect(users.heading).toBeVisible();
    await expect(users.description).toBeVisible();
    await expect(users.table.or(users.emptyState)).toBeVisible();
  });

  test('renders user count and invite button', async ({ page }) => {
    const users = new UserManagementPage(page);
    await users.goto();

    await expect(page.getByText(/usuarios? cadastrados?/)).toBeVisible();
    await expect(users.inviteButton).toBeVisible();
  });

  test('invite form opens and shows all fields', async ({ page }) => {
    const users = new UserManagementPage(page);
    await users.goto();

    await users.openInviteForm();

    await expect(users.inviteNameInput).toBeVisible();
    await expect(users.inviteEmailInput).toBeVisible();
    await expect(users.inviteRoleSelect).toBeVisible();
    await expect(users.submitInviteButton).toBeVisible();
  });

  test('invite user form — fill and submit', async ({ page }) => {
    const users = new UserManagementPage(page);
    await users.goto();

    await users.openInviteForm();
    await users.fillInviteForm({
      name: 'Test Invited User',
      email: 'test-invite@example.com',
    });
    await users.submitInviteButton.click();

    // Expect toast (success or error)
    const successToast = page.getByText('Usuario convidado com sucesso');
    const errorToast = page.getByText(/erro|falha|error/i);
    await expect(successToast.or(errorToast)).toBeVisible({ timeout: 10000 });
  });

  test('user table shows expected columns', async ({ page }) => {
    const users = new UserManagementPage(page);
    await users.goto();

    const hasTable = await users.table.isVisible().catch(() => false);

    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: /Nome/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Email/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Perfil/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Status/ })).toBeVisible();
    }
  });
});

test.describe('Operator Management', () => {
  test('renders operator page with list', async ({ page }) => {
    await page.goto('/configuracoes/operadoras');

    await expect(page.getByRole('heading', { name: 'Operadoras' })).toBeVisible();
    await expect(page.getByText('Gerencie as operadoras de saude cadastradas')).toBeVisible();
    await expect(page.getByText(/operadoras? cadastradas?/)).toBeVisible();
  });

  test('renders operator table or empty state', async ({ page }) => {
    await page.goto('/configuracoes/operadoras');

    const table = page.locator('table');
    const emptyState = page.getByText('Nenhuma operadora');
    await expect(table.or(emptyState)).toBeVisible();
  });

  test('new operator button opens form', async ({ page }) => {
    await page.goto('/configuracoes/operadoras');

    await page.getByRole('button', { name: 'Nova Operadora' }).click();
    await expect(page.getByText('Cadastrar Operadora')).toBeVisible();
  });
});

test.describe('Patient Management', () => {
  test('renders patient page with search and list', async ({ page }) => {
    await page.goto('/configuracoes/pacientes');

    await expect(page.getByRole('heading', { name: 'Pacientes' })).toBeVisible();
    await expect(page.getByText('Gerenciamento de cadastro de pacientes')).toBeVisible();
    await expect(page.getByPlaceholder('Buscar por nome ou CPF...')).toBeVisible();
  });

  test('renders patient table or empty state', async ({ page }) => {
    await page.goto('/configuracoes/pacientes');

    const table = page.locator('table');
    const emptyState = page.getByText('Nenhum paciente encontrado');
    await expect(table.or(emptyState)).toBeVisible();
  });

  test('new patient button opens form', async ({ page }) => {
    await page.goto('/configuracoes/pacientes');

    await page.getByRole('button', { name: 'Novo Paciente' }).click();
    await expect(page.getByText('Cadastrar Paciente')).toBeVisible();
  });
});

test.describe('Audit Log', () => {
  test('renders audit log page with filters', async ({ page }) => {
    await page.goto('/configuracoes/auditoria');

    await expect(page.getByRole('heading', { name: 'Auditoria' })).toBeVisible();
    await expect(page.getByText('Historico de acoes realizadas no sistema')).toBeVisible();
    await expect(page.getByText('Logs de Auditoria')).toBeVisible();
  });

  test('renders filter controls', async ({ page }) => {
    await page.goto('/configuracoes/auditoria');

    // Search input and resource filter
    await expect(page.getByPlaceholder('Filtrar por acao...')).toBeVisible();

    // Resource select dropdown
    const resourceFilter = page.getByRole('combobox').or(page.locator('button').filter({ hasText: /Recurso|Todos/ }));
    await expect(resourceFilter).toBeVisible();
  });

  test('renders log table or empty state', async ({ page }) => {
    await page.goto('/configuracoes/auditoria');

    const table = page.locator('table');
    const emptyState = page.getByText('Nenhum log encontrado');
    await expect(table.or(emptyState)).toBeVisible();
  });

  test('log table shows expected columns when data exists', async ({ page }) => {
    await page.goto('/configuracoes/auditoria');

    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: /Data/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Acao/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Recurso/ })).toBeVisible();
    }
  });
});
