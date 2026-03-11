import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/stores/ui-store', () => ({
  useUIStore: () => ({
    sidebarCollapsed: false,
    toggleSidebar: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  }),
}));

vi.mock('@/components/notifications/NotificationDropdown', () => ({
  NotificationDropdown: () => <div data-testid="notifications">Notifications</div>,
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}));

describe('AppShell', () => {
  it('renders children content', () => {
    render(
      <AppShell userEmail="test@example.com">
        <div>Page Content</div>
      </AppShell>
    );
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('renders sidebar with FinHealth branding', () => {
    render(
      <AppShell userEmail="test@example.com">
        <div>Content</div>
      </AppShell>
    );
    // FinHealth appears in both desktop sidebar and mobile drawer
    const logos = screen.getAllByText('FinHealth');
    expect(logos.length).toBeGreaterThanOrEqual(1);
  });

  it('renders mobile menu button', () => {
    render(
      <AppShell userEmail="test@example.com">
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getByLabelText('Abrir menu')).toBeInTheDocument();
  });

  it('renders main content area', () => {
    render(
      <AppShell>
        <div>Main Area</div>
      </AppShell>
    );
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveTextContent('Main Area');
  });

  it('renders system title in header', () => {
    render(
      <AppShell userEmail="test@example.com">
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getByText('Sistema de Gestao Financeira')).toBeInTheDocument();
  });
});
