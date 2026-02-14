import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

interface MonthlyData {
  month: string;
  faturamento: number;
  glosas: number;
  pagamentos: number;
}

interface GlosasTrendData {
  month: string;
  administrativa: number;
  tecnica: number;
  linear: number;
}

interface Forecast {
  nextMonthBilling: number;
  billingGrowth: number;
  estimatedGlosaRisk: number;
  averageGlosaRate: number;
}

export interface TrendsResponse {
  monthlyData: MonthlyData[];
  glosasTrendData: GlosasTrendData[];
  forecast: Forecast;
}

export function useTrends(months: number) {
  return useQuery<TrendsResponse>({
    queryKey: queryKeys.trends.data(months),
    queryFn: async () => {
      const res = await fetch(`/api/trends?months=${months}`);
      if (!res.ok) throw new Error('Failed to fetch trends');
      return res.json();
    },
  });
}
