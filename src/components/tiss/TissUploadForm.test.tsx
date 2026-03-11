import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TissUploadForm } from './TissUploadForm';

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

const mockAccounts = [
  { id: 'a1', account_number: 'CT-001', patient_name: 'Maria Silva' },
  { id: 'a2', account_number: 'CT-002', patient_name: 'Joao Santos' },
];

describe('TissUploadForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders card title', () => {
    render(<TissUploadForm accounts={mockAccounts} />);
    expect(screen.getByText('Upload de Guia TISS')).toBeInTheDocument();
  });

  it('renders account select label', () => {
    render(<TissUploadForm accounts={mockAccounts} />);
    expect(screen.getByText('Conta Medica')).toBeInTheDocument();
  });

  it('renders dropzone area', () => {
    render(<TissUploadForm accounts={mockAccounts} />);
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });

  it('renders dropzone instructions', () => {
    render(<TissUploadForm accounts={mockAccounts} />);
    expect(screen.getByText('Arraste um arquivo XML ou clique para selecionar')).toBeInTheDocument();
    expect(screen.getByText(/Suporta TISS versao 3.05.00/)).toBeInTheDocument();
  });
});
