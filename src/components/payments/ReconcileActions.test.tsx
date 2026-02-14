import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReconcileActions } from './ReconcileActions';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('ReconcileActions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it('renders vincular button', () => {
    render(
      <ReconcileActions paymentId="pay-1" accountId="acc-1" accountAmount={5000} />
    );
    expect(screen.getByText('Vincular')).toBeInTheDocument();
  });

  it('shows confirmation dialog on click', () => {
    render(
      <ReconcileActions paymentId="pay-1" accountId="acc-1" accountAmount={5000} />
    );
    fireEvent.click(screen.getByText('Vincular'));
    expect(screen.getByText('Confirmar conciliacao')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
  });

  it('calls fetch on confirm and refreshes', async () => {
    const { toast } = await import('@/hooks/use-toast');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ amountMatched: 5000 }),
    });

    render(
      <ReconcileActions paymentId="pay-1" accountId="acc-1" accountAmount={5000} />
    );

    fireEvent.click(screen.getByText('Vincular'));
    fireEvent.click(screen.getByText('Confirmar'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/reconcile', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ paymentId: 'pay-1', accountId: 'acc-1' }),
      }));
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Conciliacao realizada' }));
    });
  });

  it('shows error toast on fetch failure', async () => {
    const { toast } = await import('@/hooks/use-toast');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Erro na conciliacao' }),
    });

    render(
      <ReconcileActions paymentId="pay-1" accountId="acc-1" accountAmount={5000} />
    );

    fireEvent.click(screen.getByText('Vincular'));
    fireEvent.click(screen.getByText('Confirmar'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Erro na conciliacao', variant: 'destructive' })
      );
    });
  });
});
