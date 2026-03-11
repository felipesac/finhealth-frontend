import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications, useMarkNotificationRead } from '../use-notifications';
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

const mockNotifications = {
  data: [
    { id: 'n1', title: 'Glosa detectada', message: null, type: 'warning' as const, read: false, href: null, created_at: '2025-01-01' },
    { id: 'n2', title: 'Pagamento recebido', message: null, type: 'success' as const, read: true, href: null, created_at: '2025-01-02' },
  ],
  unreadCount: 1,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useNotifications', () => {
  it('fetches notifications', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockNotifications),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotifications(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.unreadCount).toBe(1);
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotifications(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useMarkNotificationRead', () => {
  it('performs optimistic update for single notification', async () => {
    const readNotifications = {
      data: [
        { ...mockNotifications.data[0], read: true },
        mockNotifications.data[1],
      ],
      unreadCount: 0,
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNotifications) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(readNotifications) });

    const { Wrapper, queryClient } = createWrapper();
    const setDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { result: notifResult } = renderHook(() => useNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(notifResult.current.isSuccess).toBe(true));

    const { result: mutationResult } = renderHook(() => useMarkNotificationRead(), { wrapper: Wrapper });
    mutationResult.current.mutate({ id: 'n1' });

    await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

    // Verify setQueryData was called with optimistic data (during onMutate)
    const optimisticCall = setDataSpy.mock.calls.find(
      ([, data]) => {
        const d = data as typeof mockNotifications | undefined;
        return d?.data?.[0]?.read === true;
      }
    );
    expect(optimisticCall).toBeDefined();
  });

  it('performs optimistic update for mark all read', async () => {
    const allReadNotifications = {
      data: mockNotifications.data.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNotifications) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(allReadNotifications) });

    const { Wrapper, queryClient } = createWrapper();
    const setDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { result: notifResult } = renderHook(() => useNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(notifResult.current.isSuccess).toBe(true));

    const { result: mutationResult } = renderHook(() => useMarkNotificationRead(), { wrapper: Wrapper });
    mutationResult.current.mutate({ markAllRead: true });

    await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

    const optimisticCall = setDataSpy.mock.calls.find(
      ([, data]) => {
        const d = data as typeof mockNotifications | undefined;
        return d?.unreadCount === 0 && d?.data?.every((n) => n.read);
      }
    );
    expect(optimisticCall).toBeDefined();
  });

  it('rolls back on error', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNotifications) })
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(mockNotifications) });

    const { Wrapper, queryClient } = createWrapper();

    const { result: notifResult } = renderHook(() => useNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(notifResult.current.isSuccess).toBe(true));

    const { result: mutationResult } = renderHook(() => useMarkNotificationRead(), { wrapper: Wrapper });
    mutationResult.current.mutate({ id: 'n1' });

    await waitFor(() => expect(mutationResult.current.isError).toBe(true));

    // After error + rollback + refetch, data should be back to original
    await waitFor(() => {
      const cached = queryClient.getQueryData<typeof mockNotifications>(['notifications']);
      expect(cached?.data[0].read).toBe(false);
    });
  });

  it('sends PATCH request', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNotifications) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(mockNotifications) });

    const { Wrapper } = createWrapper();

    const { result: notifResult } = renderHook(() => useNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(notifResult.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper: Wrapper });
    await result.current.mutateAsync({ id: 'n1' });

    const patchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => c[1]?.method === 'PATCH'
    );
    expect(patchCall).toBeDefined();
    expect(patchCall![0]).toBe('/api/notifications');
  });
});
