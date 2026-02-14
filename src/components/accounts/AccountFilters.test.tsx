import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountFilters } from './AccountFilters';
import type { HealthInsurer } from '@/types';

const mockPush = vi.fn();
const mockPathname = '/contas';
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}));

const insurers: HealthInsurer[] = [
  {
    id: 'h1', name: 'Unimed', ans_code: '123', tiss_version: '3.05',
    config: {}, active: true, created_at: '', updated_at: '',
  },
  {
    id: 'h2', name: 'Bradesco Saude', ans_code: '456', tiss_version: '3.05',
    config: {}, active: true, created_at: '', updated_at: '',
  },
];

describe('AccountFilters', () => {
  it('renders search input', () => {
    render(<AccountFilters insurers={insurers} />);
    expect(screen.getByPlaceholderText('Buscar por numero...')).toBeInTheDocument();
  });

  it('renders status select with options', () => {
    render(<AccountFilters insurers={insurers} />);
    // The select triggers should be present
    const triggers = screen.getAllByRole('combobox');
    expect(triggers.length).toBe(3); // status, type, insurer
  });

  it('renders reset button', () => {
    render(<AccountFilters insurers={insurers} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('updates search input value on change', () => {
    render(<AccountFilters insurers={insurers} />);
    const input = screen.getByPlaceholderText('Buscar por numero...');
    fireEvent.change(input, { target: { value: 'CT-001' } });
    expect(input).toHaveValue('CT-001');
  });
});
