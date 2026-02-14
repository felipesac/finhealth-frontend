import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccountsTable } from './AccountsTable';
import type { MedicalAccount } from '@/types';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockAccounts: MedicalAccount[] = [
  {
    id: '1',
    organization_id: 'org-1',
    account_number: 'CT-001',
    account_type: 'internacao',
    status: 'pending',
    total_amount: 5000,
    approved_amount: 4500,
    glosa_amount: 500,
    paid_amount: 0,
    metadata: {},
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    patient: { id: 'p1', name: 'Maria Silva', created_at: '', updated_at: '' },
    health_insurer: {
      id: 'h1', name: 'Unimed', ans_code: '123', tiss_version: '3.05',
      config: {}, active: true, created_at: '', updated_at: '',
    },
  },
  {
    id: '2',
    organization_id: 'org-1',
    account_number: 'CT-002',
    account_type: 'ambulatorial',
    status: 'paid',
    total_amount: 3000,
    approved_amount: 3000,
    glosa_amount: 0,
    paid_amount: 3000,
    metadata: {},
    created_at: '2024-06-14T10:00:00Z',
    updated_at: '2024-06-14T10:00:00Z',
  },
];

describe('AccountsTable', () => {
  it('renders table headers', () => {
    render(<AccountsTable accounts={mockAccounts} />);
    expect(screen.getByText('Numero')).toBeInTheDocument();
    expect(screen.getAllByText('Paciente').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Operadora').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tipo').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Valor Total').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
  });

  it('renders account rows with data', () => {
    render(<AccountsTable accounts={mockAccounts} />);
    expect(screen.getAllByText('CT-001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CT-002').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Maria Silva').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Unimed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Internacao').length).toBeGreaterThanOrEqual(1);
  });

  it('renders links to account details', () => {
    render(<AccountsTable accounts={mockAccounts} />);
    const links = screen.getAllByRole('link', { name: 'CT-001' });
    expect(links[0]).toHaveAttribute('href', '/contas/1');
  });

  it('shows dash for missing patient/insurer', () => {
    render(<AccountsTable accounts={[mockAccounts[1]]} />);
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('renders empty state when no accounts', () => {
    render(<AccountsTable accounts={[]} />);
    expect(screen.getAllByText('Nenhuma conta encontrada').length).toBeGreaterThanOrEqual(1);
  });

  it('shows glosa amount when greater than zero', () => {
    render(<AccountsTable accounts={mockAccounts} />);
    // Glosa amount appears in both table and card views
    expect(screen.getAllByText(/500/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders card view with account-card testids', () => {
    render(<AccountsTable accounts={mockAccounts} />);
    const cards = screen.getAllByTestId('account-card');
    expect(cards).toHaveLength(2);
  });

  it('renders both table and card views via ResponsiveTable', () => {
    const { container } = render(<AccountsTable accounts={mockAccounts} />);
    const tableWrapper = container.querySelector('.hidden.md\\:block');
    const cardsWrapper = container.querySelector('.block.md\\:hidden');
    expect(tableWrapper).toBeInTheDocument();
    expect(cardsWrapper).toBeInTheDocument();
  });

  it('card view shows key fields for each account', () => {
    render(<AccountsTable accounts={mockAccounts} />);
    // Data appears in both table and card views
    expect(screen.getAllByText('CT-001').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Maria Silva').length).toBeGreaterThanOrEqual(2);
  });

  it('card view has checkboxes for bulk selection', () => {
    render(<AccountsTable accounts={mockAccounts} />);
    // Header checkbox + 2 table rows + 2 card rows = at least 5
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(5);
  });
});
