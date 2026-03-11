'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { DashboardMetrics } from '@/types';

interface DashboardData {
  metrics: DashboardMetrics;
  paymentChartData: { month: string; received: number; matched: number }[];
  accountStatusData: { status: string; count: number; label: string }[];
  glosasTrendData: { month: string; amount: number }[];
}

export function useDashboardMetrics(orgId: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(orgId),
    queryFn: async (): Promise<DashboardData> => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    staleTime: 60_000,
    enabled: !!orgId,
  });
}
