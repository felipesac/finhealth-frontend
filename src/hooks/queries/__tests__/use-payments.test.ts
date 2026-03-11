import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePayments, usePayment, useCreatePayment } from '../use-payments';
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

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('usePayments', () => {
  it('fetches payments list', async () => {
    const payments = [{ id: 'p1', amount: 500, reconciliation_status: 'matched' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: payments, pagination: { page: 1, totalPages: 1 } }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePayments('org-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(payments);
  });

  it('appends reconciliation_status and search filters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [], pagination: {} }),
    });

    const { Wrapper } = createWrapper();
    renderHook(() => usePayments('org-1', { reconciliation_status: 'pending', search: 'test' }), { wrapper: Wrapper });

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('reconciliation_status=pending');
    expect(url).toContain('search=test');
  });

  it('is disabled when orgId is empty', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePayments(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePayments('org-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('usePayment', () => {
  it('fetches a single payment by id', async () => {
    const payment = { id: 'p1', amount: 500 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: payment }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePayment('org-1', 'p1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(payment);
  });
});

describe('useCreatePayment', () => {
  it('posts new payment and invalidates queries', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreatePayment('org-1'), { wrapper: Wrapper });
    await result.current.mutateAsync({ amount: 1000 });

    expect(fetch).toHaveBeenCalledWith('/api/payments', expect.objectContaining({ method: 'POST' }));
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });
});
