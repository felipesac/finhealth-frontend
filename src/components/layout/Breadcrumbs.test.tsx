import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Breadcrumbs } from './Breadcrumbs';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

const mockUsePathname = vi.mocked(usePathname);

describe('Breadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null on /dashboard', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    const { container } = render(<Breadcrumbs />);
    expect(container.innerHTML).toBe('');
  });

  it('renders breadcrumb nav on /contas/nova', () => {
    mockUsePathname.mockReturnValue('/contas/nova');
    render(<Breadcrumbs />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByText('Home', { selector: '.sr-only' })).toBeInTheDocument();
    expect(screen.getByText('Nova Conta')).toBeInTheDocument();
  });

  it('shows "Contas Médicas" segment label for contas', () => {
    mockUsePathname.mockReturnValue('/contas/nova');
    render(<Breadcrumbs />);
    expect(screen.getByText('Contas Medicas')).toBeInTheDocument();
  });

  it('last segment has aria-current="page"', () => {
    mockUsePathname.mockReturnValue('/contas/nova');
    render(<Breadcrumbs />);
    const lastSegment = screen.getByText('Nova Conta');
    expect(lastSegment).toHaveAttribute('aria-current', 'page');
  });
});
