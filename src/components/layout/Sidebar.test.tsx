import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar, navItems } from './Sidebar';

const mockCollapsed = false;
const mockToggle = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/stores/ui-store', () => ({
  useUIStore: () => ({
    sidebarCollapsed: mockCollapsed,
    toggleSidebar: mockToggle,
  }),
}));

describe('Sidebar', () => {
  it('renders all navigation items', () => {
    render(<Sidebar />);
    for (const item of navItems) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });

  it('renders correct number of nav links and expandable buttons', () => {
    render(<Sidebar />);
    const links = screen.getAllByRole('link');
    const itemsWithSub = navItems.filter(i => i.subItems && i.subItems.length > 0);
    const itemsWithoutSub = navItems.filter(i => !i.subItems || i.subItems.length === 0);
    // Items with subItems render as buttons, not links
    expect(links).toHaveLength(itemsWithoutSub.length);
    for (const item of itemsWithSub) {
      expect(screen.getByText(item.label).closest('button')).toBeInTheDocument();
    }
  });

  it('highlights active nav item', () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('non-active items do not have aria-current', () => {
    render(<Sidebar />);
    const relatoriosLink = screen.getByText('Relatorios').closest('a');
    expect(relatoriosLink).not.toHaveAttribute('aria-current');
  });

  it('renders toggle button with correct aria-label', () => {
    render(<Sidebar />);
    const toggleBtn = screen.getByLabelText('Recolher menu lateral');
    expect(toggleBtn).toBeInTheDocument();
  });

  it('calls toggleSidebar on toggle button click', () => {
    render(<Sidebar />);
    const toggleBtn = screen.getByLabelText('Recolher menu lateral');
    fireEvent.click(toggleBtn);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('renders navigation landmark', () => {
    render(<Sidebar />);
    expect(screen.getByLabelText('Navegacao principal')).toBeInTheDocument();
  });

  it('calls onNavigate when a link is clicked', () => {
    const onNavigate = vi.fn();
    render(<Sidebar onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Relatorios'));
    expect(onNavigate).toHaveBeenCalled();
  });
});
