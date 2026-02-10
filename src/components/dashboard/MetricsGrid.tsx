'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import {
  DollarSign,
  AlertTriangle,
  CreditCard,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { DashboardMetrics } from '@/types';

interface MetricsGridProps {
  metrics: DashboardMetrics;
}

function MetricsGridInner({ metrics }: MetricsGridProps) {
  const t = useTranslations('dashboard');

  const cards = [
    {
      title: t('totalBilling'),
      value: formatCurrency(metrics.totalBilling),
      icon: DollarSign,
      description: t('totalBillingDesc'),
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: t('totalGlosasTitle'),
      value: formatCurrency(metrics.totalGlosas),
      icon: AlertTriangle,
      description: t('totalGlosasDesc'),
      iconBg: 'bg-red-50 dark:bg-red-950/50',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      title: t('totalPayments'),
      value: formatCurrency(metrics.totalPayments),
      icon: CreditCard,
      description: t('totalPaymentsDesc'),
      iconBg: 'bg-blue-50 dark:bg-blue-950/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: t('pendingAccounts'),
      value: metrics.pendingAccounts.toString(),
      icon: Clock,
      description: t('pendingAccountsDesc'),
      iconBg: 'bg-amber-50 dark:bg-amber-950/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: t('successRate'),
      value: `${metrics.appealSuccessRate.toFixed(1)}%`,
      icon: TrendingUp,
      description: t('successRateDesc'),
      iconBg: 'bg-violet-50 dark:bg-violet-950/50',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.iconBg}`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export const MetricsGrid = React.memo(MetricsGridInner);
