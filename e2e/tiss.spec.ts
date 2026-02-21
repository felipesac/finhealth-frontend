import { test, expect } from '@playwright/test';
import { TissListPage } from './pages/tiss-list.page';
import { TissUploadPage } from './pages/tiss-upload.page';
import path from 'path';

test.describe('TISS Guides List', () => {
  test('renders TISS page with heading and upload button', async ({ page }) => {
    const tiss = new TissListPage(page);
    await tiss.goto();

    await expect(tiss.heading).toBeVisible();
    await expect(tiss.description).toBeVisible();
    await expect(tiss.uploadButton).toBeVisible();
  });

  test('renders guides table or empty state', async ({ page }) => {
    const tiss = new TissListPage(page);
    await tiss.goto();

    await expect(tiss.table.or(tiss.emptyState)).toBeVisible();
  });

  test('upload button navigates to upload page', async ({ page }) => {
    const tiss = new TissListPage(page);
    await tiss.goto();

    await tiss.uploadButton.click();
    await expect(page).toHaveURL(/\/tiss\/upload/);
  });
});

test.describe('TISS Upload', () => {
  test('renders upload page with form elements', async ({ page }) => {
    const upload = new TissUploadPage(page);
    await upload.goto();

    await expect(upload.heading).toBeVisible();
    await expect(upload.description).toBeVisible();
    await expect(upload.accountSelect).toBeVisible();
    await expect(upload.dropzone).toBeVisible();
  });

  test('file input accepts XML files', async ({ page }) => {
    const upload = new TissUploadPage(page);
    await upload.goto();

    // Upload sample XML fixture
    const sampleXmlPath = path.join(__dirname, 'fixtures', 'sample-tiss.xml');
    await upload.uploadFile(sampleXmlPath);

    // File name should appear after selection
    await expect(page.getByText('sample-tiss.xml')).toBeVisible();
  });

  test('shows account selection requirement', async ({ page }) => {
    const upload = new TissUploadPage(page);
    await upload.goto();

    // Account select should be visible with placeholder
    await expect(upload.accountSelect).toBeVisible();
  });
});

test.describe('TISS Validation', () => {
  test('renders validation page with metric cards', async ({ page }) => {
    await page.goto('/tiss/validacao');

    await expect(page.getByRole('heading', { name: 'Validacao TISS' })).toBeVisible();
    await expect(page.getByText('Listagem de validacoes de guias TISS')).toBeVisible();

    // 4 metric cards
    await expect(page.getByText('Total Guias')).toBeVisible();
    await expect(page.getByText('Validas')).toBeVisible();
    await expect(page.getByText('Invalidas')).toBeVisible();
    await expect(page.getByText('Pendentes')).toBeVisible();
  });

  test('renders validation table or empty state', async ({ page }) => {
    await page.goto('/tiss/validacao');

    const table = page.locator('table');
    const emptyState = page.getByText('Nenhuma guia TISS encontrada');
    await expect(table.or(emptyState)).toBeVisible();
  });
});

test.describe('TISS Batches', () => {
  test('renders batches page with metric cards', async ({ page }) => {
    await page.goto('/tiss/lotes');

    await expect(page.getByRole('heading', { name: 'Lotes TISS' })).toBeVisible();
    await expect(page.getByText('Gerenciamento de lotes de guias TISS')).toBeVisible();

    // 4 metric cards
    await expect(page.getByText('Total de Guias')).toBeVisible();
    await expect(page.getByText('Valor Total')).toBeVisible();
    await expect(page.getByText('Enviados')).toBeVisible();
    await expect(page.getByText('Pendentes')).toBeVisible();
  });

  test('renders batches table or empty state', async ({ page }) => {
    await page.goto('/tiss/lotes');

    const table = page.locator('table');
    const emptyState = page.getByText('Nenhuma guia TISS encontrada');
    await expect(table.or(emptyState)).toBeVisible();
  });
});

test.describe('TISS Certificates', () => {
  test('renders certificates page with upload form', async ({ page }) => {
    await page.goto('/tiss/certificados');

    await expect(page.getByRole('heading', { name: 'Certificados Digitais' })).toBeVisible();
    await expect(page.getByText('Gerenciamento de certificados digitais')).toBeVisible();

    // Upload form or certificate display should be visible
    const uploadForm = page.getByText('Certificado Digital');
    await expect(uploadForm).toBeVisible();
  });

  test('certificate form has name and file inputs', async ({ page }) => {
    await page.goto('/tiss/certificados');

    // Name input
    const nameInput = page.locator('#cert-name');
    await expect(nameInput).toBeVisible();

    // File dropzone should be present
    const dropzone = page.getByText(/Arraste um arquivo .pfx ou .p12/);
    await expect(dropzone).toBeVisible();
  });
});
