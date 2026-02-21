import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardWidgets } from './DashboardWidgets';

vi.mock('@/stores/dashboard-store', () => ({
  useDashboardStore: () => ({
    widgets: [
      { id: 'metrics', label: 'Metricas', visible: true },
      { id: 'chart', label: 'Grafico', visible: false },
    ],
    toggleWidget: vi.fn(),
    moveWidget: vi.fn(),
    resetWidgets: vi.fn(),
  }),
}));

const widgetMap: Record<string, React.ReactNode> = {
  metrics: <div data-testid="widget-metrics">Metrics Widget</div>,
  chart: <div data-testid="widget-chart">Chart Widget</div>,
};

describe('DashboardWidgets', () => {
  it('renders visible widgets', () => {
    render(<DashboardWidgets widgetMap={widgetMap} />);
    expect(screen.getByTestId('widget-metrics')).toBeInTheDocument();
  });

  it('does not render hidden widgets', () => {
    render(<DashboardWidgets widgetMap={widgetMap} />);
    expect(screen.queryByTestId('widget-chart')).not.toBeInTheDocument();
  });
});
