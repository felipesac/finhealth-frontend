import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentsChart } from './PaymentsChart';

// Mock recharts to avoid rendering issues in jsdom
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock formatCurrency used by the component's tooltip
vi.mock('@/lib/formatters', () => ({
  formatCurrency: (v: number) => 'R$ ' + v.toFixed(2),
}));

const mockData = [
  { month: 'Jan', received: 50000, matched: 45000 },
  { month: 'Fev', received: 62000, matched: 58000 },
  { month: 'Mar', received: 55000, matched: 52000 },
];

describe('PaymentsChart', () => {
  it('renders title', () => {
    render(<PaymentsChart data={mockData} />);
    expect(screen.getByText('Evolucao de Pagamentos')).toBeInTheDocument();
  });

  it('renders chart', () => {
    render(<PaymentsChart data={mockData} />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('returns null with empty data', () => {
    const { container } = render(<PaymentsChart data={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
