import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsurerManagement } from './InsurerManagement';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
  toast: vi.fn(),
}));

const mockInsurers = [
  {
    id: '1',
    ans_code: '123456',
    name: 'Operadora Teste',
    cnpj: '12345678000190',
    tiss_version: '3.05.00',
    contact_email: 'teste@operadora.com',
    active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    ans_code: '654321',
    name: 'Operadora Beta',
    cnpj: null,
    tiss_version: '4.00.00',
    contact_email: null,
    active: false,
    created_at: '2024-02-01T00:00:00Z',
  },
];

describe('InsurerManagement', () => {
  it('renders count of insurers', () => {
    render(<InsurerManagement initialInsurers={mockInsurers} />);
    expect(screen.getByText('2 operadoras cadastradas')).toBeInTheDocument();
  });

  it('renders Nova Operadora button', () => {
    render(<InsurerManagement initialInsurers={mockInsurers} />);
    expect(screen.getByText('Nova Operadora')).toBeInTheDocument();
  });

  it('renders insurer data in table', () => {
    render(<InsurerManagement initialInsurers={mockInsurers} />);
    expect(screen.getByText('Operadora Teste')).toBeInTheDocument();
    expect(screen.getByText('123456')).toBeInTheDocument();
    expect(screen.getByText('12345678000190')).toBeInTheDocument();
    expect(screen.getByText('3.05.00')).toBeInTheDocument();
    expect(screen.getByText('Operadora Beta')).toBeInTheDocument();
  });

  it('shows empty state when no insurers', () => {
    render(<InsurerManagement initialInsurers={[]} />);
    expect(screen.getByText('0 operadoras cadastradas')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma operadora')).toBeInTheDocument();
  });
});
