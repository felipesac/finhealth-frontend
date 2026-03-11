import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePaymentModal } from './CreatePaymentModal';

beforeEach(() => {
  vi.restoreAllMocks();
});

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  accountIds: ['acc-1'],
  onConfirm: vi.fn().mockResolvedValue(undefined),
};

describe('CreatePaymentModal', () => {
  it('renders modal with title and form fields', () => {
    render(<CreatePaymentModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Registrar Pagamento' })).toBeInTheDocument();
    expect(screen.getByLabelText('Valor Pago (R$)')).toBeInTheDocument();
    expect(screen.getByLabelText('Data do Pagamento')).toBeInTheDocument();
    expect(screen.getByLabelText('Referencia / Observacao')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('shows singular text for 1 account', () => {
    render(<CreatePaymentModal {...defaultProps} accountIds={['acc-1']} />);
    expect(screen.getByText(/a conta selecionada/)).toBeInTheDocument();
  });

  it('shows plural text for multiple accounts', () => {
    render(<CreatePaymentModal {...defaultProps} accountIds={['a', 'b']} />);
    expect(screen.getByText(/as 2 contas selecionadas/)).toBeInTheDocument();
  });

  it('defaults payment date to today', () => {
    render(<CreatePaymentModal {...defaultProps} />);

    const dateInput = screen.getByLabelText('Data do Pagamento') as HTMLInputElement;
    const today = new Date().toISOString().split('T')[0];
    expect(dateInput.value).toBe(today);
  });

  it('validates empty amount', async () => {
    const user = userEvent.setup();
    render(<CreatePaymentModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Registrar Pagamento' }));

    expect(screen.getByText(/Valor pago obrigatorio/)).toBeInTheDocument();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<CreatePaymentModal {...defaultProps} onConfirm={onConfirm} />);

    await user.type(screen.getByLabelText('Valor Pago (R$)'), '2500');
    await user.type(screen.getByLabelText('Referencia / Observacao'), 'Lote 42');

    await user.click(screen.getByRole('button', { name: 'Registrar Pagamento' }));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        total_amount: 2500,
        payment_reference: 'Lote 42',
      })
    );
  });

  it('shows error on submission failure', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new Error('Payment failed'));
    render(<CreatePaymentModal {...defaultProps} onConfirm={onConfirm} />);

    await user.type(screen.getByLabelText('Valor Pago (R$)'), '100');

    await user.click(screen.getByRole('button', { name: 'Registrar Pagamento' }));

    expect(screen.getByText('Payment failed')).toBeInTheDocument();
  });

  it('closes modal on cancel', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<CreatePaymentModal {...defaultProps} onOpenChange={onOpenChange} />);

    await user.click(screen.getByText('Cancelar'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
