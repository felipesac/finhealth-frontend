import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationDropdown } from './NotificationDropdown';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/formatters', () => ({
  formatRelative: () => 'ha 5 minutos',
}));

const mockNotifications = [
  {
    id: 'n1',
    title: 'Nova glosa detectada',
    message: 'Glosa GL-001 precisa de acao',
    type: 'warning',
    read: false,
    href: '/glosas/g1',
    created_at: '2024-06-15T10:00:00Z',
  },
  {
    id: 'n2',
    title: 'Recurso aceito',
    message: null,
    type: 'success',
    read: true,
    href: null,
    created_at: '2024-06-14T10:00:00Z',
  },
];

describe('NotificationDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockNotifications, unreadCount: 1 }),
    });
  });

  it('renders notification bell button', () => {
    render(<NotificationDropdown />);
    expect(screen.getByLabelText(/Notificacoes/)).toBeInTheDocument();
  });

  it('fetches notifications on mount', async () => {
    render(<NotificationDropdown />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications');
    });
  });

  it('displays unread badge count', async () => {
    render(<NotificationDropdown />);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('opens dropdown and shows notifications', async () => {
    const user = userEvent.setup();
    render(<NotificationDropdown />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText(/Notificacoes/));

    await waitFor(() => {
      expect(screen.getByText('Nova glosa detectada')).toBeInTheDocument();
      expect(screen.getByText('Recurso aceito')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], unreadCount: 0 }),
    });

    const user = userEvent.setup();
    render(<NotificationDropdown />);

    await user.click(screen.getByLabelText(/Notificacoes/));

    await waitFor(() => {
      expect(screen.getByText('Nenhuma notificacao')).toBeInTheDocument();
    });
  });
});
