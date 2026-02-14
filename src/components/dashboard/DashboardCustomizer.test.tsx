import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardCustomizer } from './DashboardCustomizer';

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

describe('DashboardCustomizer', () => {
  it('shows Personalizar button when closed', () => {
    render(<DashboardCustomizer />);
    expect(screen.getByText('Personalizar')).toBeInTheDocument();
  });

  it('shows widget list when opened', () => {
    render(<DashboardCustomizer />);
    fireEvent.click(screen.getByText('Personalizar'));
    expect(screen.getByText('Personalizar Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Metricas')).toBeInTheDocument();
    expect(screen.getByText('Grafico')).toBeInTheDocument();
  });

  it('shows Restaurar Padrao button', () => {
    render(<DashboardCustomizer />);
    fireEvent.click(screen.getByText('Personalizar'));
    expect(screen.getByText('Restaurar Padrao')).toBeInTheDocument();
  });
});
