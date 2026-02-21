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
    organization_id: 'org-1',
    health_insurer_id: 'h1',
    payment_date: '2024-06-15',
    payment_reference: 'REF-001',
    total_amount: 10000,
    matched_amount: 8000,
    unmatched_amount: 2000,
    reconciliation_status: 'partial',
    metadata: {},
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    health_insurer: {
      id: 'h1', name: 'Unimed', ans_code: '123', tiss_version: '3.05',
      config: {}, active: true, created_at: '', updated_at: '',
    },
  },
  {
    id: 'pay-2',
    organization_id: 'org-1',
    health_insurer_id: 'h1',
    payment_date: '2024-06-14',
    payment_reference: 'REF-002',
    total_amount: 5000,
    matched_amount: 5000,
    unmatched_amount: 0,
    reconciliation_status: 'matched',
    metadata: {},
    created_at: '2024-06-14T10:00:00Z',
    updated_at: '2024-06-14T10:00:00Z',
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
    expect(screen.getAllByText('Operadora').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Data Pagamento')).toBeInTheDocument();
    expect(screen.getAllByText('Valor Total').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
  });

  it('renders payment rows', () => {
    render(<PaymentsTable payments={mockPayments} />);
    expect(screen.getAllByText('REF-001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('REF-002').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Unimed').length).toBeGreaterThanOrEqual(2);
  });

  it('renders links to payment details', () => {
    render(<PaymentsTable payments={mockPayments} />);
    const links = screen.getAllByRole('link', { name: 'REF-001' });
    expect(links[0]).toHaveAttribute('href', '/pagamentos/pay-1');
  });

  it('renders reconciliation badges', () => {
    render(<PaymentsTable payments={mockPayments} />);
    expect(screen.getAllByText('Parcial').length).toBeGreaterThanOrEqual(1);
    const conciliados = screen.getAllByText('Conciliado');
    expect(conciliados.length).toBeGreaterThanOrEqual(2);
  });

  it('filters by search text', () => {
    render(<PaymentsTable payments={mockPayments} />);
    const searchInput = screen.getByPlaceholderText('Buscar por referencia...');
    fireEvent.change(searchInput, { target: { value: 'REF-001' } });
    expect(screen.getAllByText('REF-001').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('REF-002')).not.toBeInTheDocument();
  });

  it('shows empty state when no payments match', () => {
    render(<PaymentsTable payments={[]} />);
    expect(screen.getAllByText('Nenhum pagamento encontrado').length).toBeGreaterThanOrEqual(1);
  });

  it('resets filters on clear button click', () => {
    render(<PaymentsTable payments={mockPayments} />);
    const searchInput = screen.getByPlaceholderText('Buscar por referencia...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(screen.getAllByText('Nenhum pagamento encontrado').length).toBeGreaterThanOrEqual(1);

    const resetButtons = screen.getAllByRole('button');
    const clearBtn = resetButtons.find(btn => btn.querySelector('.lucide-x'));
    if (clearBtn) fireEvent.click(clearBtn);

    expect(screen.getAllByText('REF-001').length).toBeGreaterThanOrEqual(1);
  });

  it('renders card view with payment-card testids', () => {
    render(<PaymentsTable payments={mockPayments} />);
    const cards = screen.getAllByTestId('payment-card');
    expect(cards).toHaveLength(2);
  });

  it('renders both table and card views via ResponsiveTable', () => {
    const { container } = render(<PaymentsTable payments={mockPayments} />);
    const tableWrapper = container.querySelector('.hidden.md\\:block');
    const cardsWrapper = container.querySelector('.block.md\\:hidden');
    expect(tableWrapper).toBeInTheDocument();
    expect(cardsWrapper).toBeInTheDocument();
  });

  it('card view shows key fields for each payment', () => {
    render(<PaymentsTable payments={mockPayments} />);
    // Data appears in both table and card views
    expect(screen.getAllByText('REF-001').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Unimed').length).toBeGreaterThanOrEqual(4);
  });
});
