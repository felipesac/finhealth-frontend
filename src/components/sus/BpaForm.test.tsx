import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BpaForm } from './BpaForm';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('BpaForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it('renders form title', () => {
    render(<BpaForm />);
    expect(screen.getByText('Novo BPA')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<BpaForm />);
    expect(screen.getByLabelText('CNES')).toBeInTheDocument();
    expect(screen.getByLabelText('Competencia')).toBeInTheDocument();
    expect(screen.getByLabelText('CBO')).toBeInTheDocument();
    expect(screen.getByLabelText('Codigo Procedimento (SIGTAP)')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantidade')).toBeInTheDocument();
    expect(screen.getByLabelText('CNPJ Prestador')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<BpaForm />);
    expect(screen.getByText('Salvar BPA')).toBeInTheDocument();
  });

  it('submits form and redirects on success', async () => {
    const { toast } = await import('@/hooks/use-toast');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'bpa-1' }),
    });

    render(<BpaForm />);

    fireEvent.change(screen.getByLabelText('CNES'), { target: { value: '1234567' } });
    fireEvent.change(screen.getByLabelText('Competencia'), { target: { value: '2024-01' } });
    fireEvent.change(screen.getByLabelText('CBO'), { target: { value: '225125' } });
    fireEvent.change(screen.getByLabelText('Codigo Procedimento (SIGTAP)'), { target: { value: '0301010072' } });

    fireEvent.click(screen.getByText('Salvar BPA'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/sus/bpa', expect.objectContaining({
        method: 'POST',
      }));
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'BPA criado com sucesso' }));
      expect(mockPush).toHaveBeenCalledWith('/sus/bpa');
    });
  });

  it('shows error toast on submit failure', async () => {
    const { toast } = await import('@/hooks/use-toast');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'CNES invalido' }),
    });

    render(<BpaForm />);

    // Fill required fields to pass native HTML validation
    fireEvent.change(screen.getByLabelText('CNES'), { target: { value: '1234567' } });
    fireEvent.change(screen.getByLabelText('Competencia'), { target: { value: '2024-01' } });
    fireEvent.change(screen.getByLabelText('CBO'), { target: { value: '225125' } });
    fireEvent.change(screen.getByLabelText('Codigo Procedimento (SIGTAP)'), { target: { value: '0301010072' } });

    fireEvent.click(screen.getByText('Salvar BPA'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Erro ao criar BPA', variant: 'destructive' })
      );
    });
  });
});
