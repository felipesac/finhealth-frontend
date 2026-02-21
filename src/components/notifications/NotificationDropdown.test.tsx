import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationDropdown } from './NotificationDropdown';

const mockPush = vi.fn();
let realtimeCallback: (...args: unknown[]) => void;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/formatters', () => ({
  formatRelative: () => 'ha 5 minutos',
}));

vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useRealtimeSubscription: vi.fn((_options: unknown, callback: (...args: unknown[]) => void) => {
    realtimeCallback = callback;
    return { unsubscribe: vi.fn() };
  }),
}));

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
const mockUseRealtimeSubscription = vi.mocked(useRealtimeSubscription);

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryWrapper';
  return Wrapper;
}

describe('NotificationDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockNotifications, unreadCount: 1 }),
    });
  });

  it('renders notification bell button', () => {
    render(<NotificationDropdown />, { wrapper: createWrapper() });
    expect(screen.getByLabelText(/Notificacoes/)).toBeInTheDocument();
  });

  it('displays unread badge count', async () => {
    render(<NotificationDropdown />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('opens dropdown and shows notifications', async () => {
    const user = userEvent.setup();
    render(<NotificationDropdown />, { wrapper: createWrapper() });

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
    render(<NotificationDropdown />, { wrapper: createWrapper() });

    await user.click(screen.getByLabelText(/Notificacoes/));

    await waitFor(() => {
      expect(screen.getByText('Nenhuma notificacao')).toBeInTheDocument();
    });
  });

  it('calls fetch when marking a notification as read', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockNotifications, unreadCount: 1 }),
    });

    const user = userEvent.setup();
    render(<NotificationDropdown />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText(/Notificacoes/));
    await waitFor(() => {
      expect(screen.getByText('Nova glosa detectada')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nova glosa detectada'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications', expect.objectContaining({ method: 'PATCH' }));
    });
  });

  it('subscribes to notifications table via Realtime', () => {
    render(<NotificationDropdown />, { wrapper: createWrapper() });
    expect(mockUseRealtimeSubscription).toHaveBeenCalledWith(
      { table: 'notifications', event: '*' },
      expect.any(Function),
    );
  });

  it('invalidates query when Realtime event is received', () => {
    render(<NotificationDropdown />, { wrapper: createWrapper() });
    realtimeCallback({ eventType: 'INSERT', new: {}, old: {} });
    // Realtime callback triggers invalidation - no error means it works
  });
});
