import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TissGuidesList } from './TissGuidesList';
import type { MedicalAccount } from '@/types';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const mockAccounts: MedicalAccount[] = [
  {
    id: 'a1',
    account_number: 'CT-001',
    account_type: 'internacao',
    status: 'sent',
    total_amount: 5000,
    approved_amount: 4500,
    glosa_amount: 500,
    paid_amount: 0,
    metadata: {},
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    tiss_guide_number: 'TISS-001',
    tiss_guide_type: 'sadt',
    tiss_validation_status: 'valid',
  },
  {
    id: 'a2',
    account_number: 'CT-002',
    account_type: 'ambulatorial',
    status: 'pending',
    total_amount: 3000,
    approved_amount: 0,
    glosa_amount: 0,
    paid_amount: 0,
    metadata: {},
    created_at: '2024-06-14T10:00:00Z',
    updated_at: '2024-06-14T10:00:00Z',
    // No tiss_guide_number - should be filtered out
  },
];

describe('TissGuidesList', () => {
  it('renders table headers', () => {
    render(<TissGuidesList accounts={mockAccounts} />);
    expect(screen.getByText('Numero da Guia')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Conta')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
    expect(screen.getByText('Validacao')).toBeInTheDocument();
  });

  it('only renders accounts with tiss_guide_number', () => {
    render(<TissGuidesList accounts={mockAccounts} />);
    expect(screen.getByText('TISS-001')).toBeInTheDocument();
    expect(screen.queryByText('CT-002')).not.toBeInTheDocument();
  });

  it('renders validation status badge', () => {
    render(<TissGuidesList accounts={mockAccounts} />);
    expect(screen.getByText('valid')).toBeInTheDocument();
  });

  it('renders link to account details', () => {
    render(<TissGuidesList accounts={mockAccounts} />);
    const link = screen.getByText('CT-001').closest('a');
    expect(link).toHaveAttribute('href', '/contas/a1');
  });

  it('renders link to TISS viewer', () => {
    render(<TissGuidesList accounts={mockAccounts} />);
    const viewerLinks = screen.getAllByRole('link');
    const viewerLink = viewerLinks.find(l => l.getAttribute('href') === '/tiss/viewer/a1');
    expect(viewerLink).toBeInTheDocument();
  });

  it('shows empty state when no guides exist', () => {
    const accountsWithoutGuides = mockAccounts.filter(a => !a.tiss_guide_number);
    render(<TissGuidesList accounts={accountsWithoutGuides.length ? accountsWithoutGuides : []} />);
    expect(screen.getByText('Nenhuma guia TISS encontrada')).toBeInTheDocument();
  });
});
