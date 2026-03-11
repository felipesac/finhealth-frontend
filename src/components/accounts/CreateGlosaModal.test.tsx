import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateGlosaModal } from './CreateGlosaModal';

beforeEach(() => {
  vi.restoreAllMocks();
});

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  accountIds: ['acc-1'],
  onConfirm: vi.fn().mockResolvedValue(undefined),
};

describe('CreateGlosaModal', () => {
  it('renders modal with title and form fields', () => {
    render(<CreateGlosaModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Registrar Glosa' })).toBeInTheDocument();
    expect(screen.getByLabelText('Valor Glosado (R$)')).toBeInTheDocument();
    expect(screen.getByLabelText('Codigo da Glosa')).toBeInTheDocument();
    expect(screen.getByLabelText('Motivo / Descricao')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar Glosa' })).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('shows singular text for 1 account', () => {
    render(<CreateGlosaModal {...defaultProps} accountIds={['acc-1']} />);
    expect(screen.getByText(/a conta selecionada/)).toBeInTheDocument();
  });

  it('shows plural text for multiple accounts', () => {
    render(<CreateGlosaModal {...defaultProps} accountIds={['acc-1', 'acc-2', 'acc-3']} />);
    expect(screen.getByText(/as 3 contas selecionadas/)).toBeInTheDocument();
  });

  it('validates empty amount', async () => {
    const user = userEvent.setup();
    render(<CreateGlosaModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Registrar Glosa' }));

    expect(screen.getByText(/Valor glosado obrigatorio/)).toBeInTheDocument();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('validates empty glosa code', async () => {
    const user = userEvent.setup();
    render(<CreateGlosaModal {...defaultProps} />);

    await user.type(screen.getByLabelText('Valor Glosado (R$)'), '100');

    // Select glosa type
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Administrativa' }));

    await user.click(screen.getByRole('button', { name: 'Registrar Glosa' }));

    expect(screen.getByText(/Codigo da glosa obrigatorio/)).toBeInTheDocument();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<CreateGlosaModal {...defaultProps} onConfirm={onConfirm} />);

    await user.type(screen.getByLabelText('Valor Glosado (R$)'), '150.50');
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Tecnica' }));
    await user.type(screen.getByLabelText('Codigo da Glosa'), 'GA001');
    await user.type(screen.getByLabelText('Motivo / Descricao'), 'Motivo teste');

    await user.click(screen.getByRole('button', { name: 'Registrar Glosa' }));

    expect(onConfirm).toHaveBeenCalledWith({
      glosa_amount: 150.50,
      glosa_type: 'tecnica',
      glosa_code: 'GA001',
      glosa_description: 'Motivo teste',
    });
  });

  it('shows error on submission failure', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new Error('Server error'));
    render(<CreateGlosaModal {...defaultProps} onConfirm={onConfirm} />);

    await user.type(screen.getByLabelText('Valor Glosado (R$)'), '100');
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Linear' }));
    await user.type(screen.getByLabelText('Codigo da Glosa'), 'GL01');

    await user.click(screen.getByRole('button', { name: 'Registrar Glosa' }));

    expect(screen.getByText('Server error')).toBeInTheDocument();
  });

  it('closes modal on cancel', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<CreateGlosaModal {...defaultProps} onOpenChange={onOpenChange} />);

    await user.click(screen.getByText('Cancelar'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
