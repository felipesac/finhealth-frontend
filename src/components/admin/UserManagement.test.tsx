import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagement } from './UserManagement';

const mockToast = vi.fn();
const mockMutate = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/hooks/useSWRFetch', () => ({
  useSWRFetch: vi.fn(),
}));

import { useSWRFetch } from '@/hooks/useSWRFetch';
const mockUseSWRFetch = vi.mocked(useSWRFetch);

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

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSWRFetch.mockReturnValue({
      data: { success: true, data: mockUsers },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    } as ReturnType<typeof useSWRFetch>);
  });

  it('renders user list', () => {
    render(<UserManagement />);
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Auditor User')).toBeInTheDocument();
  });

  it('displays user count', () => {
    render(<UserManagement />);
    expect(screen.getByText('2 usuarios cadastrados')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseSWRFetch.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: mockMutate,
    } as ReturnType<typeof useSWRFetch>);

    render(<UserManagement />);
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
  });

  it('shows invite form when button clicked', async () => {
    const user = userEvent.setup();
    render(<UserManagement />);

    await user.click(screen.getByText('Convidar Usuario'));

    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('calls mutate after successful invite', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const user = userEvent.setup();
    render(<UserManagement />);

    await user.click(screen.getByText('Convidar Usuario'));
    await user.type(screen.getByLabelText('Nome'), 'Novo User');
    await user.type(screen.getByLabelText('Email'), 'novo@test.com');
    await user.click(screen.getByText('Convidar'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('fetches users via SWR', () => {
    render(<UserManagement />);
    expect(mockUseSWRFetch).toHaveBeenCalledWith('/api/users');
  });

  it('shows empty state when no users', () => {
    mockUseSWRFetch.mockReturnValue({
      data: { success: true, data: [] },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    } as ReturnType<typeof useSWRFetch>);

    render(<UserManagement />);
    expect(screen.getByText('Nenhum usuario encontrado')).toBeInTheDocument();
  });
});
