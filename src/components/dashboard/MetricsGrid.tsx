'use client';

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

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const cards = [
    {
      title: 'Faturamento Total',
      value: formatCurrency(metrics.totalBilling),
      icon: DollarSign,
      description: 'Total faturado',
      color: 'text-green-500',
    },
    {
      title: 'Total em Glosas',
      value: formatCurrency(metrics.totalGlosas),
      icon: AlertTriangle,
      description: 'Valor glosado',
      color: 'text-red-500',
    },
    {
      title: 'Pagamentos',
      value: formatCurrency(metrics.totalPayments),
      icon: CreditCard,
      description: 'Total recebido',
      color: 'text-blue-500',
    },
    {
      title: 'Contas Pendentes',
      value: metrics.pendingAccounts.toString(),
      icon: Clock,
      description: 'Aguardando',
      color: 'text-yellow-500',
    },
    {
      title: 'Taxa de Sucesso',
      value: `${metrics.appealSuccessRate.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Em recursos',
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
