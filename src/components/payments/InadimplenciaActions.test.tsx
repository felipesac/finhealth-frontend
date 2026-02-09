import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InadimplenciaActions } from './InadimplenciaActions';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

describe('InadimplenciaActions', () => {
  const defaultProps = {
    accountId: 'acc-1',
    accountNumber: 'CONTA-12345',
    currentStatus: 'pendente',
  };

  it('renders Acao button', () => {
    render(<InadimplenciaActions {...defaultProps} />);
    expect(screen.getByText('Acao')).toBeInTheDocument();
  });

  it('opens dialog when clicked', () => {
    render(<InadimplenciaActions {...defaultProps} />);
    fireEvent.click(screen.getByText('Acao'));
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Acao de Inadimplencia')).toBeInTheDocument();
  });

  it('shows account number in dialog description', () => {
    render(<InadimplenciaActions {...defaultProps} />);
    fireEvent.click(screen.getByText('Acao'));
    expect(screen.getByText(/CONTA-12345/)).toBeInTheDocument();
    expect(screen.getByText(/pendente/)).toBeInTheDocument();
  });

  it('shows Cancelar and Confirmar buttons in dialog', () => {
    render(<InadimplenciaActions {...defaultProps} />);
    fireEvent.click(screen.getByText('Acao'));
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
  });

  it('shows select options for status', () => {
    render(<InadimplenciaActions {...defaultProps} />);
    fireEvent.click(screen.getByText('Acao'));
    expect(screen.getByText('Em Cobranca')).toBeInTheDocument();
    expect(screen.getByText('Negociado')).toBeInTheDocument();
    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText('Perda')).toBeInTheDocument();
  });
});
