import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationDropdown } from './NotificationDropdown';

const mockPush = vi.fn();
const mockMutate = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/formatters', () => ({
  formatRelative: () => 'ha 5 minutos',
}));

vi.mock('@/hooks/useSWRFetch', () => ({
  useSWRFetch: vi.fn(),
}));

import { useSWRFetch } from '@/hooks/useSWRFetch';
const mockUseSWRFetch = vi.mocked(useSWRFetch);

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
    mockUseSWRFetch.mockReturnValue({
      data: { data: mockNotifications, unreadCount: 1 },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    } as ReturnType<typeof useSWRFetch>);
  });

  it('renders notification bell button', () => {
    render(<NotificationDropdown />);
    expect(screen.getByLabelText(/Notificacoes/)).toBeInTheDocument();
  });

  it('displays unread badge count', () => {
    render(<NotificationDropdown />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('opens dropdown and shows notifications', async () => {
    const user = userEvent.setup();
    render(<NotificationDropdown />);

    await user.click(screen.getByLabelText(/Notificacoes/));

    await waitFor(() => {
      expect(screen.getByText('Nova glosa detectada')).toBeInTheDocument();
      expect(screen.getByText('Recurso aceito')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    mockUseSWRFetch.mockReturnValue({
      data: { data: [], unreadCount: 0 },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    } as ReturnType<typeof useSWRFetch>);

    const user = userEvent.setup();
    render(<NotificationDropdown />);

    await user.click(screen.getByLabelText(/Notificacoes/));

    await waitFor(() => {
      expect(screen.getByText('Nenhuma notificacao')).toBeInTheDocument();
    });
  });

  it('calls mutate after marking a notification as read', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<NotificationDropdown />);

    await user.click(screen.getByLabelText(/Notificacoes/));
    await waitFor(() => {
      expect(screen.getByText('Nova glosa detectada')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nova glosa detectada'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('uses SWR with refreshInterval for polling', () => {
    render(<NotificationDropdown />);
    expect(mockUseSWRFetch).toHaveBeenCalledWith('/api/notifications', {
      refreshInterval: 60000,
    });
  });
});
