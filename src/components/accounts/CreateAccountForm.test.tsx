import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateAccountForm } from './CreateAccountForm';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const patients = [
  { id: 'p1', name: 'Maria Silva' },
  { id: 'p2', name: 'Joao Santos' },
];

const insurers = [
  { id: 'h1', name: 'Unimed' },
  { id: 'h2', name: 'Bradesco Saude' },
];

describe('CreateAccountForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it('renders form title', () => {
    render(<CreateAccountForm patients={patients} insurers={insurers} />);
    expect(screen.getByText('Nova Conta Medica')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<CreateAccountForm patients={patients} insurers={insurers} />);
    expect(screen.getByLabelText('Numero da Conta')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
    expect(screen.getByLabelText('Paciente')).toBeInTheDocument();
    expect(screen.getByLabelText('Operadora')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de Admissao')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de Alta')).toBeInTheDocument();
    expect(screen.getByLabelText('Valor Total (R$)')).toBeInTheDocument();
  });

  it('renders patient and insurer options', () => {
    render(<CreateAccountForm patients={patients} insurers={insurers} />);
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Joao Santos')).toBeInTheDocument();
    expect(screen.getByText('Unimed')).toBeInTheDocument();
    expect(screen.getByText('Bradesco Saude')).toBeInTheDocument();
  });

  it('renders account type options', () => {
    render(<CreateAccountForm patients={patients} insurers={insurers} />);
    expect(screen.getByText('Internacao')).toBeInTheDocument();
    expect(screen.getByText('Ambulatorial')).toBeInTheDocument();
    expect(screen.getByText('SADT')).toBeInTheDocument();
    expect(screen.getByText('Honorarios')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<CreateAccountForm patients={patients} insurers={insurers} />);
    expect(screen.getByText('Salvar Conta')).toBeInTheDocument();
  });

  it('submits form and redirects on success', async () => {
    const { toast } = await import('@/hooks/use-toast');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'new-1' }),
    });

    render(<CreateAccountForm patients={patients} insurers={insurers} />);

    fireEvent.change(screen.getByLabelText('Numero da Conta'), { target: { value: 'CT-100' } });
    fireEvent.change(screen.getByLabelText('Paciente'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText('Operadora'), { target: { value: 'h1' } });
    fireEvent.change(screen.getByLabelText('Data de Admissao'), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText('Valor Total (R$)'), { target: { value: '5000' } });

    fireEvent.click(screen.getByText('Salvar Conta'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/accounts', expect.objectContaining({
        method: 'POST',
      }));
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Conta medica criada com sucesso' }));
      expect(mockPush).toHaveBeenCalledWith('/contas');
    });
  });

  it('shows error toast on submit failure', async () => {
    const { toast } = await import('@/hooks/use-toast');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Validation error' }),
    });

    render(<CreateAccountForm patients={patients} insurers={insurers} />);

    // Fill required fields to pass native HTML validation
    fireEvent.change(screen.getByLabelText('Numero da Conta'), { target: { value: 'CT-100' } });
    fireEvent.change(screen.getByLabelText('Paciente'), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText('Operadora'), { target: { value: 'h1' } });
    fireEvent.change(screen.getByLabelText('Data de Admissao'), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText('Valor Total (R$)'), { target: { value: '1000' } });

    fireEvent.click(screen.getByText('Salvar Conta'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Erro ao criar conta', variant: 'destructive' })
      );
    });
  });
});
