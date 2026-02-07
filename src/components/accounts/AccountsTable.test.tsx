import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccountsTable } from './AccountsTable';
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
    health_insurer: {
      id: 'h1', name: 'Unimed', ans_code: '123', tiss_version: '3.05',
      config: {}, active: true, created_at: '', updated_at: '',
    },
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

describe('AccountsTable', () => {
  it('renders table headers', () => {
    render(<AccountsTable accounts={mockAccounts} />);
    expect(screen.getByText('Numero')).toBeInTheDocument();
    expect(screen.getByText('Paciente')).toBeInTheDocument();
    expect(screen.getByText('Operadora')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Valor Total')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders account rows with data', () => {
    render(<AccountsTable accounts={mockAccounts} />);
    expect(screen.getByText('CT-001')).toBeInTheDocument();
    expect(screen.getByText('CT-002')).toBeInTheDocument();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Unimed')).toBeInTheDocument();
    expect(screen.getByText('Internacao')).toBeInTheDocument();
  });

  it('renders links to account details', () => {
    render(<AccountsTable accounts={mockAccounts} />);
    const link = screen.getByText('CT-001').closest('a');
    expect(link).toHaveAttribute('href', '/contas/1');
  });

  it('shows dash for missing patient/insurer', () => {
    render(<AccountsTable accounts={[mockAccounts[1]]} />);
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('renders empty state when no accounts', () => {
    render(<AccountsTable accounts={[]} />);
    expect(screen.getByText('Nenhuma conta encontrada')).toBeInTheDocument();
  });

  it('shows glosa amount when greater than zero', () => {
    render(<AccountsTable accounts={mockAccounts} />);
    // CT-001 has glosa_amount: 500
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });
});
