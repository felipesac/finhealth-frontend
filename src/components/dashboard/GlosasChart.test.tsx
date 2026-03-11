import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlosasChart } from './GlosasChart';

// Mock recharts to avoid rendering issues in jsdom
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Legend: () => null,
  Tooltip: () => null,
}));

const mockData = [
  { type: 'administrativa' as const, count: 10, amount: 5000 },
  { type: 'tecnica' as const, count: 8, amount: 3500 },
  { type: 'linear' as const, count: 5, amount: 2000 },
];

describe('GlosasChart', () => {
  it('renders chart title', () => {
    render(<GlosasChart data={mockData} />);
    expect(screen.getByText('Glosas por Tipo')).toBeInTheDocument();
  });

  it('renders pie chart', () => {
    render(<GlosasChart data={mockData} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<GlosasChart data={[]} />);
    expect(screen.getByText('Glosas por Tipo')).toBeInTheDocument();
  });
});
