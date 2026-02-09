import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProcedureManagement } from './ProcedureManagement';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/lib/formatters', () => ({
  formatCurrency: (v: number) => 'R$ ' + v.toFixed(2),
}));

describe('ProcedureManagement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });
  });

  it('renders Novo Procedimento button', () => {
    render(<ProcedureManagement accountId="acc-1" />);
    expect(screen.getByText('Novo Procedimento')).toBeInTheDocument();
  });

  it('shows empty state after loading', async () => {
    render(<ProcedureManagement accountId="acc-1" />);
    await waitFor(() => {
      expect(screen.getByText('Nenhum procedimento cadastrado')).toBeInTheDocument();
    });
  });

  it('renders table headers', async () => {
    render(<ProcedureManagement accountId="acc-1" />);
    await waitFor(() => {
      expect(screen.getByText('Nenhum procedimento cadastrado')).toBeInTheDocument();
    });
    expect(screen.getByText('Codigo TUSS')).toBeInTheDocument();
    expect(screen.getByText('Descricao')).toBeInTheDocument();
    expect(screen.getByText('Qtd')).toBeInTheDocument();
    expect(screen.getByText('Valor Unit.')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Profissional')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Acoes')).toBeInTheDocument();
  });

  it('shows procedure count as zero initially', async () => {
    render(<ProcedureManagement accountId="acc-1" />);
    await waitFor(() => {
      expect(screen.getByText('Procedimentos (0)')).toBeInTheDocument();
    });
  });

  it('fetches procedures with correct account id', async () => {
    render(<ProcedureManagement accountId="acc-42" />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/procedures?account_id=acc-42');
    });
  });
});
