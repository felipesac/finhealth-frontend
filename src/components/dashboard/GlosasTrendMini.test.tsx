import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlosasTrendMini } from './GlosasTrendMini';

// Mock recharts to avoid rendering issues in jsdom
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock formatCurrency
vi.mock('@/lib/formatters', () => ({
  formatCurrency: (v: number) => 'R$ ' + v.toFixed(2),
}));

describe('GlosasTrendMini', () => {
  it('renders title', () => {
    const data = [
      { month: 'Jan', amount: 10000 },
      { month: 'Fev', amount: 8000 },
    ];
    render(<GlosasTrendMini data={data} />);
    expect(screen.getByText('Tendencia de Glosas')).toBeInTheDocument();
  });

  it('shows "Reducao" when last < prev', () => {
    const data = [
      { month: 'Jan', amount: 10000 },
      { month: 'Fev', amount: 8000 },
    ];
    render(<GlosasTrendMini data={data} />);
    expect(screen.getByText('R$ 8000.00')).toBeInTheDocument();
    expect(screen.getByText(/Reducao/)).toBeInTheDocument();
  });

  it('shows "Aumento" when last > prev', () => {
    const data = [
      { month: 'Jan', amount: 5000 },
      { month: 'Fev', amount: 12000 },
    ];
    render(<GlosasTrendMini data={data} />);
    expect(screen.getByText('R$ 12000.00')).toBeInTheDocument();
    expect(screen.getByText(/Aumento/)).toBeInTheDocument();
  });

  it('returns null with less than 2 items', () => {
    const { container } = render(<GlosasTrendMini data={[{ month: 'Jan', amount: 5000 }]} />);
    expect(container.innerHTML).toBe('');
  });
});
