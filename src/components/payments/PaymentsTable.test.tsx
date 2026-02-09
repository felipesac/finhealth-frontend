import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentsTable } from './PaymentsTable';
import type { Payment } from '@/types';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockPayments: Payment[] = [
  {
    id: 'pay-1',
    health_insurer_id: 'h1',
    payment_date: '2024-06-15',
    payment_reference: 'REF-001',
    total_amount: 10000,
    matched_amount: 8000,
    unmatched_amount: 2000,
    reconciliation_status: 'partial',
    metadata: {},
    created_at: '2024-06-15T10:00:00Z',
    health_insurer: {
      id: 'h1', name: 'Unimed', ans_code: '123', tiss_version: '3.05',
      config: {}, active: true, created_at: '', updated_at: '',
    },
  },
  {
    id: 'pay-2',
    health_insurer_id: 'h1',
    payment_date: '2024-06-14',
    payment_reference: 'REF-002',
    total_amount: 5000,
    matched_amount: 5000,
    unmatched_amount: 0,
    reconciliation_status: 'matched',
    metadata: {},
    created_at: '2024-06-14T10:00:00Z',
    health_insurer: {
      id: 'h1', name: 'Unimed', ans_code: '123', tiss_version: '3.05',
      config: {}, active: true, created_at: '', updated_at: '',
    },
  },
];

describe('PaymentsTable', () => {
  it('renders table headers', () => {
    render(<PaymentsTable payments={mockPayments} />);
    expect(screen.getByText('Referencia')).toBeInTheDocument();
    expect(screen.getByText('Operadora')).toBeInTheDocument();
    expect(screen.getByText('Data Pagamento')).toBeInTheDocument();
    expect(screen.getByText('Valor Total')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders payment rows', () => {
    render(<PaymentsTable payments={mockPayments} />);
    expect(screen.getByText('REF-001')).toBeInTheDocument();
    expect(screen.getByText('REF-002')).toBeInTheDocument();
    expect(screen.getAllByText('Unimed')).toHaveLength(2);
  });

  it('renders links to payment details', () => {
    render(<PaymentsTable payments={mockPayments} />);
    const link = screen.getByText('REF-001').closest('a');
    expect(link).toHaveAttribute('href', '/pagamentos/pay-1');
  });

  it('renders reconciliation badges', () => {
    render(<PaymentsTable payments={mockPayments} />);
    expect(screen.getByText('Parcial')).toBeInTheDocument();
    // "Conciliado" appears as both table header and badge
    const conciliados = screen.getAllByText('Conciliado');
    expect(conciliados.length).toBeGreaterThanOrEqual(2);
  });

  it('filters by search text', () => {
    render(<PaymentsTable payments={mockPayments} />);
    const searchInput = screen.getByPlaceholderText('Buscar por referencia...');
    fireEvent.change(searchInput, { target: { value: 'REF-001' } });
    expect(screen.getByText('REF-001')).toBeInTheDocument();
    expect(screen.queryByText('REF-002')).not.toBeInTheDocument();
  });

  it('shows empty state when no payments match', () => {
    render(<PaymentsTable payments={[]} />);
    expect(screen.getByText('Nenhum pagamento encontrado')).toBeInTheDocument();
  });

  it('resets filters on clear button click', () => {
    render(<PaymentsTable payments={mockPayments} />);
    const searchInput = screen.getByPlaceholderText('Buscar por referencia...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(screen.getByText('Nenhum pagamento encontrado')).toBeInTheDocument();

    // Click the X reset button
    const resetButtons = screen.getAllByRole('button');
    const clearBtn = resetButtons.find(btn => btn.querySelector('.lucide-x'));
    if (clearBtn) fireEvent.click(clearBtn);

    expect(screen.getByText('REF-001')).toBeInTheDocument();
  });
});
