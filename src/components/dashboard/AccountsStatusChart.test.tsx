import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccountsStatusChart } from './AccountsStatusChart';

// Mock recharts to avoid rendering issues in jsdom
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  Cell: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockData = [
  { status: 'pending', count: 12, label: 'Pendente' },
  { status: 'validated', count: 8, label: 'Validada' },
  { status: 'paid', count: 5, label: 'Paga' },
];

describe('AccountsStatusChart', () => {
  it('renders title when data provided', () => {
    render(<AccountsStatusChart data={mockData} />);
    expect(screen.getByText('Contas por Status')).toBeInTheDocument();
  });

  it('renders bar chart', () => {
    render(<AccountsStatusChart data={mockData} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('returns null with empty data', () => {
    const { container } = render(<AccountsStatusChart data={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
