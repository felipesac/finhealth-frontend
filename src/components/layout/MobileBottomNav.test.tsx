import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { MobileBottomNav } from './MobileBottomNav';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

const mockUsePathname = vi.mocked(usePathname);

describe('MobileBottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('renders all 5 nav items', () => {
    render(<MobileBottomNav />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Contas')).toBeInTheDocument();
    expect(screen.getByText('Glosas')).toBeInTheDocument();
    expect(screen.getByText('Pagam.')).toBeInTheDocument();
    expect(screen.getByText('Relat.')).toBeInTheDocument();
  });

  it('marks active item with aria-current="page"', () => {
    mockUsePathname.mockReturnValue('/glosas');
    render(<MobileBottomNav />);
    const glosasLink = screen.getByText('Glosas').closest('a');
    expect(glosasLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders navigation landmark', () => {
    render(<MobileBottomNav />);
    expect(screen.getByRole('navigation', { name: 'Navegacao mobile' })).toBeInTheDocument();
  });
});
