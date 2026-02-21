import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}));

vi.mock('@/components/notifications/NotificationDropdown', () => ({
  NotificationDropdown: () => <div data-testid="notifications">Notifications</div>,
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders system title', () => {
    render(<Header userEmail="user@test.com" />);
    expect(screen.getByText('Sistema de Gestao Financeira')).toBeInTheDocument();  // from header.systemName
  });

  it('renders mobile menu button', () => {
    render(<Header userEmail="user@test.com" />);
    expect(screen.getByLabelText('Abrir menu')).toBeInTheDocument();  // from header.openMenu
  });

  it('calls onMobileMenuToggle on menu button click', () => {
    const onToggle = vi.fn();
    render(<Header userEmail="user@test.com" onMobileMenuToggle={onToggle} />);
    fireEvent.click(screen.getByLabelText('Abrir menu'));  // from header.openMenu
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders theme toggle', () => {
    render(<Header userEmail="user@test.com" />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders notification dropdown', () => {
    render(<Header userEmail="user@test.com" />);
    expect(screen.getByTestId('notifications')).toBeInTheDocument();
  });

  it('renders user avatar with initials', () => {
    render(<Header userEmail="user@test.com" />);
    expect(screen.getByText('US')).toBeInTheDocument();
  });

  it('renders user menu button', () => {
    render(<Header userEmail="user@test.com" />);
    expect(screen.getByLabelText('Menu do usuario')).toBeInTheDocument();  // from header.userMenu
  });

  it('shows default initials when no email', () => {
    render(<Header />);
    expect(screen.getByText('US')).toBeInTheDocument();
  });

  it('renders header as banner landmark', () => {
    render(<Header userEmail="user@test.com" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
