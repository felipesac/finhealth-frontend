import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGlosas, useGlosa, useCreateGlosa } from '../use-glosas';
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

describe('useGlosas', () => {
  it('fetches glosas list', async () => {
    const glosas = [{ id: 'g1', reason: 'Procedimento invalido' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: glosas, pagination: { page: 1, totalPages: 1 } }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useGlosas('org-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(glosas);
  });

  it('appends appeal_status and medical_account_id filters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [], pagination: {} }),
    });

    const { Wrapper } = createWrapper();
    renderHook(() => useGlosas('org-1', { appeal_status: 'pending', medical_account_id: 'ma-1' }), { wrapper: Wrapper });

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('appeal_status=pending');
    expect(url).toContain('medical_account_id=ma-1');
  });

  it('is disabled when orgId is empty', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useGlosas(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useGlosas('org-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('403');
  });
});

describe('useGlosa', () => {
  it('fetches a single glosa by id', async () => {
    const glosa = { id: 'g1', reason: 'Test' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: glosa }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useGlosa('org-1', 'g1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(glosa);
  });
});

describe('useCreateGlosa', () => {
  it('posts new glosa and invalidates queries', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateGlosa('org-1'), { wrapper: Wrapper });
    await result.current.mutateAsync({ reason: 'Duplicated' });

    expect(fetch).toHaveBeenCalledWith('/api/glosas', expect.objectContaining({ method: 'POST' }));
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });
});
