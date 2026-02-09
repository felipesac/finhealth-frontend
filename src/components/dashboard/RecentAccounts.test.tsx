import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentAccounts } from './RecentAccounts';
import type { MedicalAccount } from '@/types';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockAccounts: MedicalAccount[] = [
  {
    id: '1',
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
  },
  {
    id: '2',
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

describe('RecentAccounts', () => {
  it('renders card title', () => {
    render(<RecentAccounts accounts={mockAccounts} />);
    expect(screen.getByText('Contas Recentes')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<RecentAccounts accounts={mockAccounts} />);
    expect(screen.getByText('Numero')).toBeInTheDocument();
    expect(screen.getByText('Paciente')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  it('renders account data with links', () => {
    render(<RecentAccounts accounts={mockAccounts} />);
    expect(screen.getByText('CT-001')).toBeInTheDocument();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    const link = screen.getByText('CT-001').closest('a');
    expect(link).toHaveAttribute('href', '/contas/1');
  });

  it('shows dash for missing patient name', () => {
    render(<RecentAccounts accounts={[mockAccounts[1]]} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<RecentAccounts accounts={mockAccounts} />);
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('Paga')).toBeInTheDocument();
  });

  it('shows empty state when no accounts', () => {
    render(<RecentAccounts accounts={[]} />);
    expect(screen.getByText('Nenhuma conta encontrada')).toBeInTheDocument();
  });
});
