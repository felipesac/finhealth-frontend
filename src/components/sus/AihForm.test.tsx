import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AihForm } from './AihForm';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('AihForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it('renders form title', () => {
    render(<AihForm />);
    expect(screen.getByText('Nova AIH')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<AihForm />);
    expect(screen.getByLabelText('Numero AIH')).toBeInTheDocument();
    expect(screen.getByLabelText('CNES')).toBeInTheDocument();
    expect(screen.getByLabelText('Procedimento Principal (SIGTAP)')).toBeInTheDocument();
    expect(screen.getByLabelText('Procedimento Secundario')).toBeInTheDocument();
    expect(screen.getByLabelText('CBO Medico')).toBeInTheDocument();
    expect(screen.getByLabelText('Data Internacao')).toBeInTheDocument();
    expect(screen.getByLabelText('Data Saida')).toBeInTheDocument();
    expect(screen.getByLabelText('Valor (R$)')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<AihForm />);
    expect(screen.getByText('Salvar AIH')).toBeInTheDocument();
  });

  it('submits form and redirects on success', async () => {
    const { toast } = await import('@/hooks/use-toast');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'aih-1' }),
    });

    render(<AihForm />);

    fireEvent.change(screen.getByLabelText('Numero AIH'), { target: { value: '1234567890123' } });
    fireEvent.change(screen.getByLabelText('CNES'), { target: { value: '1234567' } });
    fireEvent.change(screen.getByLabelText('Procedimento Principal (SIGTAP)'), { target: { value: '0301010072' } });
    fireEvent.change(screen.getByLabelText('Data Internacao'), { target: { value: '2024-01-15' } });

    fireEvent.click(screen.getByText('Salvar AIH'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/sus/aih', expect.objectContaining({
        method: 'POST',
      }));
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'AIH criada com sucesso' }));
      expect(mockPush).toHaveBeenCalledWith('/sus/aih');
    });
  });

  it('shows error toast on submit failure', async () => {
    const { toast } = await import('@/hooks/use-toast');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Numero AIH invalido' }),
    });

    render(<AihForm />);

    // Fill required fields to pass native HTML validation
    fireEvent.change(screen.getByLabelText('Numero AIH'), { target: { value: '1234567890123' } });
    fireEvent.change(screen.getByLabelText('CNES'), { target: { value: '1234567' } });
    fireEvent.change(screen.getByLabelText('Procedimento Principal (SIGTAP)'), { target: { value: '0301010072' } });
    fireEvent.change(screen.getByLabelText('Data Internacao'), { target: { value: '2024-01-15' } });

    fireEvent.click(screen.getByText('Salvar AIH'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Erro ao criar AIH', variant: 'destructive' })
      );
    });
  });
});
