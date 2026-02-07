import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockSignIn = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSignIn },
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('shows validation errors for invalid email', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'invalid');
    await userEvent.type(screen.getByLabelText('Senha'), '123456');
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Email invalido')).toBeInTheDocument();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows validation error for empty password', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'test@test.com');
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Senha obrigatoria')).toBeInTheDocument();
    });
  });

  it('calls supabase signIn with valid credentials', async () => {
    mockSignIn.mockResolvedValueOnce({ data: {}, error: null });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'password123');
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'password123',
      });
    });
  });

  it('redirects to dashboard on successful login', async () => {
    mockSignIn.mockResolvedValueOnce({ data: {}, error: null });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'password123');
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('displays auth error from supabase', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: {},
      error: { message: 'Invalid login credentials' },
    });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'wrong');
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
    });
  });
});
