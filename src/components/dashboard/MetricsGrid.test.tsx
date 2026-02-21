import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsGrid } from './MetricsGrid';
import type { DashboardMetrics } from '@/types';

const mockMetrics: DashboardMetrics = {
  totalBilling: 150000,
  totalGlosas: 25000,
  totalPayments: 120000,
  pendingAccounts: 12,
  appealSuccessRate: 67.5,
  glosasBreakdown: [
    { type: 'administrativa', count: 5, amount: 10000 },
    { type: 'tecnica', count: 3, amount: 8000 },
    { type: 'linear', count: 2, amount: 7000 },
  ],
};

describe('MetricsGrid', () => {
  it('renders all 5 metric cards', () => {
    render(<MetricsGrid metrics={mockMetrics} />);
    expect(screen.getByText('Faturamento Total')).toBeInTheDocument();
    expect(screen.getByText('Total em Glosas')).toBeInTheDocument();
    expect(screen.getByText('Pagamentos')).toBeInTheDocument();
    expect(screen.getByText('Contas Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Taxa de Sucesso')).toBeInTheDocument();
  });

  it('displays formatted currency values', () => {
    render(<MetricsGrid metrics={mockMetrics} />);
    // formatCurrency formats to BRL
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();
    expect(screen.getByText(/120\.000/)).toBeInTheDocument();
  });

  it('displays pending accounts count', () => {
    render(<MetricsGrid metrics={mockMetrics} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('displays appeal success rate with percentage', () => {
    render(<MetricsGrid metrics={mockMetrics} />);
    expect(screen.getByText('67.5%')).toBeInTheDocument();
  });

  it('handles zero values gracefully', () => {
    const zeroMetrics: DashboardMetrics = {
      totalBilling: 0,
      totalGlosas: 0,
      totalPayments: 0,
      pendingAccounts: 0,
      appealSuccessRate: 0,
      glosasBreakdown: [],
    };
    render(<MetricsGrid metrics={zeroMetrics} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});
