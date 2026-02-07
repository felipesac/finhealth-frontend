import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlosasTable } from './GlosasTable';
import type { Glosa } from '@/types';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
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
    success_probability: 0.75,
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
    expect(screen.getByText('Conta')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Valor Original')).toBeInTheDocument();
    expect(screen.getByText('Valor Glosado')).toBeInTheDocument();
    expect(screen.getByText('Probabilidade')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders glosa rows with data', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    expect(screen.getByText('GL-001')).toBeInTheDocument();
    expect(screen.getByText('GL-002')).toBeInTheDocument();
    expect(screen.getByText('CT-100')).toBeInTheDocument();
    expect(screen.getByText('Administrativa')).toBeInTheDocument();
  });

  it('renders links to glosa details', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    const link = screen.getByText('GL-001').closest('a');
    expect(link).toHaveAttribute('href', '/glosas/g1');
  });

  it('renders appeal status badges', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('Enviado')).toBeInTheDocument();
  });

  it('renders success probability with progress bar', () => {
    render(<GlosasTable glosas={mockGlosas} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders empty state when no glosas', () => {
    render(<GlosasTable glosas={[]} />);
    expect(screen.getByText('Nenhuma glosa encontrada')).toBeInTheDocument();
  });
});
