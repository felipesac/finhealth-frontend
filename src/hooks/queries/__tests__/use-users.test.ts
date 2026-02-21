import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers, useInviteUser, useUpdateUser } from '../use-users';
import React from 'react';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'QueryWrapper';
  return { Wrapper, queryClient };
}

const mockUsers = [
  { id: 'u1', email: 'admin@test.com', name: 'Admin', role: 'admin', active: true, created_at: '2025-01-01', last_sign_in_at: null },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useUsers', () => {
  it('fetches users list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockUsers }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUsers(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockUsers);
    expect(fetch).toHaveBeenCalledWith('/api/users');
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUsers(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useInviteUser', () => {
  it('posts invite and invalidates users', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useInviteUser(), { wrapper: Wrapper });
    await result.current.mutateAsync({ email: 'new@test.com', name: 'New User', role: 'viewer' });

    expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({ method: 'POST' }));
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('sends correct payload', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useInviteUser(), { wrapper: Wrapper });
    await result.current.mutateAsync({ email: 'a@b.com', name: 'A', role: 'admin' });

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body).toEqual({ email: 'a@b.com', name: 'A', role: 'admin' });
  });
});

describe('useUpdateUser', () => {
  it('patches user and invalidates queries', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateUser(), { wrapper: Wrapper });
    await result.current.mutateAsync({ userId: 'u1', role: 'manager', active: false });

    expect(fetch).toHaveBeenCalledWith('/api/users/u1', expect.objectContaining({ method: 'PATCH' }));
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('sends only role and active in body, not userId', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateUser(), { wrapper: Wrapper });
    await result.current.mutateAsync({ userId: 'u1', role: 'admin' });

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body).toEqual({ role: 'admin' });
    expect(body.userId).toBeUndefined();
  });
});
