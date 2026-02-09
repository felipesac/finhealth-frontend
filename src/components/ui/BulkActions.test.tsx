import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BulkActions } from './BulkActions';

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

const defaultProps = {
  selectedCount: 3,
  onClearSelection: vi.fn(),
  onBulkUpdateStatus: vi.fn(),
  onBulkDelete: vi.fn(),
  statusOptions: [
    { value: 'pending', label: 'Pendente' },
    { value: 'paid', label: 'Pago' },
  ],
  loading: false,
};

describe('BulkActions', () => {
  it('returns null when selectedCount is 0', () => {
    const { container } = render(
      <BulkActions {...defaultProps} selectedCount={0} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows count text when items selected', () => {
    render(<BulkActions {...defaultProps} />);
    expect(screen.getByText('3 selecionado(s)')).toBeInTheDocument();
  });

  it('shows Limpar button', () => {
    render(<BulkActions {...defaultProps} />);
    expect(screen.getByText('Limpar')).toBeInTheDocument();
  });

  it('shows Excluir button', () => {
    render(<BulkActions {...defaultProps} />);
    expect(screen.getByText('Excluir')).toBeInTheDocument();
  });
});
