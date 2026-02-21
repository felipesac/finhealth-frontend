'use client';

import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';

export const GlosasChart = dynamic(
  () => import('@/components/dashboard/GlosasChart').then((m) => m.GlosasChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export const PaymentsChart = dynamic(
  () => import('@/components/dashboard/PaymentsChart').then((m) => m.PaymentsChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export const AccountsStatusChart = dynamic(
  () => import('@/components/dashboard/AccountsStatusChart').then((m) => m.AccountsStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export const GlosasTrendMini = dynamic(
  () => import('@/components/dashboard/GlosasTrendMini').then((m) => m.GlosasTrendMini),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
