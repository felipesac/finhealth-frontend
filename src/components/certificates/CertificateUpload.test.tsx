import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CertificateUpload } from './CertificateUpload';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({ 'data-testid': 'dropzone' }),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}));

describe('CertificateUpload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders card title', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, certificates: [] }),
    });

    render(<CertificateUpload />);
    expect(screen.getByText('Certificado Digital')).toBeInTheDocument();
  });

  it('renders description', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, certificates: [] }),
    });

    render(<CertificateUpload />);
    expect(screen.getByText('Gerencie seu certificado digital A1 para assinatura de guias TISS')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves

    render(<CertificateUpload />);
    expect(screen.getByText('Carregando certificados...')).toBeInTheDocument();
  });

  it('shows empty state when no certificates', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, certificates: [] }),
    });

    render(<CertificateUpload />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum certificado configurado')).toBeInTheDocument();
    });
  });

  it('shows active certificate when available', async () => {
    const activeCert = {
      id: 'c1',
      name: 'Cert Clinica ABC',
      common_name: 'CLINICA ABC LTDA',
      cnpj: '12345678000190',
      status: 'active',
      valid_from: '2024-01-01',
      valid_to: '2025-12-31',
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, certificates: [activeCert] }),
    });

    render(<CertificateUpload />);

    await waitFor(() => {
      expect(screen.getByText('Cert Clinica ABC')).toBeInTheDocument();
      expect(screen.getByText('CLINICA ABC LTDA')).toBeInTheDocument();
      expect(screen.getByText('12345678000190')).toBeInTheDocument();
    });
  });

  it('renders name input and dropzone', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, certificates: [] }),
    });

    render(<CertificateUpload />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nome de identificacao')).toBeInTheDocument();
    });

    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });

  it('shows "Substituir" title when active cert exists', async () => {
    const activeCert = {
      id: 'c1',
      name: 'Cert',
      common_name: 'CN',
      status: 'active',
      valid_from: '2024-01-01',
      valid_to: '2025-12-31',
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, certificates: [activeCert] }),
    });

    render(<CertificateUpload />);

    await waitFor(() => {
      expect(screen.getByText('Substituir Certificado')).toBeInTheDocument();
    });
  });

  it('shows "Adicionar" title when no active cert', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, certificates: [] }),
    });

    render(<CertificateUpload />);

    await waitFor(() => {
      expect(screen.getByText('Adicionar Certificado')).toBeInTheDocument();
    });
  });
});
