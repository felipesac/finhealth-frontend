import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserManagement } from './UserManagement';

const mockToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockUsers = [
  {
    id: 'u1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    active: true,
    created_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: '2024-06-15T10:00:00Z',
  },
  {
    id: 'u2',
    email: 'auditor@test.com',
    name: 'Auditor User',
    role: 'auditor',
    active: true,
    created_at: '2024-02-01T00:00:00Z',
    last_sign_in_at: null,
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

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockUsers }),
    });
  });

  it('renders user list', async () => {
    render(<UserManagement />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    expect(screen.getByText('Auditor User')).toBeInTheDocument();
  });

  it('displays user count', async () => {
    render(<UserManagement />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('2 usuarios cadastrados')).toBeInTheDocument();
    });
  });

  it('shows invite form when button clicked', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Convidar Usuario')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Convidar Usuario'));

    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('calls fetch after successful invite', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockUsers }),
    });

    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Convidar Usuario')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Convidar Usuario'));
    await user.type(screen.getByLabelText('Nome'), 'Novo User');
    await user.type(screen.getByLabelText('Email'), 'novo@test.com');
    await user.click(screen.getByText('Convidar'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({ method: 'POST' }));
    });
  });

  it('shows empty state when no users', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<UserManagement />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Nenhum usuario encontrado')).toBeInTheDocument();
    });
  });
});
