import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardMetrics } from '../use-dashboard';
import React from 'react';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'QueryWrapper';
  return Wrapper;
}

const mockDashboard = {
  metrics: { totalAccounts: 10, totalGlosas: 3, totalPayments: 7, revenue: 50000 },
  paymentChartData: [{ month: 'Jan', received: 100, matched: 80 }],
  accountStatusData: [{ status: 'open', count: 5, label: 'Abertas' }],
  glosasTrendData: [{ month: 'Jan', amount: 200 }],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useDashboardMetrics', () => {
  it('fetches dashboard data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockDashboard }),
    });

    const { result } = renderHook(() => useDashboardMetrics('org-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDashboard);
    expect(fetch).toHaveBeenCalledWith('/api/dashboard/stats');
  });

  it('is disabled when orgId is empty', () => {
    const { result } = renderHook(() => useDashboardMetrics(''), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useDashboardMetrics('org-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('500');
  });
});
