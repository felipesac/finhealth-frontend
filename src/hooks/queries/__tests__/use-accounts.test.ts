import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccounts, useAccount, useCreateAccount } from '../use-accounts';
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

const mockAccounts = [
  { id: '1', patient_name: 'John', status: 'open', total_amount: 100 },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useAccounts', () => {
  it('fetches accounts list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockAccounts,
        pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAccounts('org-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockAccounts);
    expect(fetch).toHaveBeenCalledWith('/api/accounts');
  });

  it('appends filter params to URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [], pagination: {} }),
    });

    const { Wrapper } = createWrapper();
    renderHook(() => useAccounts('org-1', { page: 2, status: 'paid' }), { wrapper: Wrapper });

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('status=paid');
  });

  it('is disabled when orgId is empty', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAccounts(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAccounts('org-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('500');
  });
});

describe('useAccount', () => {
  it('fetches a single account', async () => {
    const account = { id: 'a1', patient_name: 'Jane' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: account }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAccount('org-1', 'a1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(account);
    expect(fetch).toHaveBeenCalledWith('/api/accounts/a1');
  });

  it('is disabled when id is empty', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAccount('org-1', ''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateAccount', () => {
  it('posts new account and invalidates queries', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 'new' } }),
    });

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateAccount('org-1'), { wrapper: Wrapper });

    await result.current.mutateAsync({ patient_name: 'Test' });

    expect(fetch).toHaveBeenCalledWith('/api/accounts', expect.objectContaining({ method: 'POST' }));
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });
});
