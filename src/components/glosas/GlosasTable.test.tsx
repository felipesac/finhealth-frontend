import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlosasTable } from './GlosasTable';
import type { Glosa } from '@/types';

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

const mockGlosas: Glosa[] = [
  {
    id: 'g1',
    medical_account_id: 'a1',
    glosa_code: 'GL-001',
    glosa_description: 'Guia incompleta',
    glosa_type: 'administrativa',
    original_amount: 5000,
    glosa_amount: 1200,
    appeal_status: 'pending',
    success_probability: 75,
    priority_score: 80,
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    medical_account: {
      id: 'a1', account_number: 'CT-100', account_type: 'internacao',
      status: 'glosa', total_amount: 5000, approved_amount: 3800,
      glosa_amount: 1200, paid_amount: 0, metadata: {},
      created_at: '', updated_at: '',
    },
  },
  {
    id: 'g2',
    medical_account_id: 'a2',
    glosa_code: 'GL-002',
    glosa_type: 'tecnica',
    original_amount: 3000,
    glosa_amount: 800,
    appeal_status: 'sent',
    created_at: '2024-06-14T10:00:00Z',
    updated_at: '2024-06-14T10:00:00Z',
  },
];

describe('GlosasTable', () => {
  it('renders table headers', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    expect(screen.getByText('Codigo')).toBeInTheDocument();
    expect(screen.getAllByText('Conta').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tipo').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Valor Original').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Valor Glosado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Probabilidade').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
  });

  it('renders glosa rows with data', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    expect(screen.getAllByText('GL-001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('GL-002').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CT-100').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Administrativa').length).toBeGreaterThanOrEqual(1);
  });

  it('renders links to glosa details', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    const links = screen.getAllByRole('link', { name: 'GL-001' });
    expect(links[0]).toHaveAttribute('href', '/glosas/g1');
  });

  it('renders appeal status badges', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    expect(screen.getAllByText('Pendente').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Enviado').length).toBeGreaterThanOrEqual(1);
  });

  it('renders success probability with progress bar', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    expect(screen.getAllByText('75%').length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no glosas', () => {
    render(<GlosasTable glosas={[]} />);
    expect(screen.getAllByText('Nenhuma glosa encontrada').length).toBeGreaterThanOrEqual(1);
  });

  it('renders card view with glosa-card testids', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    const cards = screen.getAllByTestId('glosa-card');
    expect(cards).toHaveLength(2);
  });

  it('renders both table and card views via ResponsiveTable', () => {
    const { container } = render(<GlosasTable glosas={mockGlosas} />);
    const tableWrapper = container.querySelector('.hidden.md\\:block');
    const cardsWrapper = container.querySelector('.block.md\\:hidden');
    expect(tableWrapper).toBeInTheDocument();
    expect(cardsWrapper).toBeInTheDocument();
  });

  it('card view shows key fields for each glosa', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    // Data appears in both table and card views
    expect(screen.getAllByText('GL-001').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Pendente').length).toBeGreaterThanOrEqual(2);
  });

  it('card view has checkboxes for bulk selection', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    // Header checkbox + 2 table rows + 2 card rows = at least 5
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(5);
  });
});
