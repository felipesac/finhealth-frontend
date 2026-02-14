import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RealtimeDashboard } from './RealtimeDashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useRealtimeSubscription: vi.fn(),
}));

vi.mock('@/components/realtime/RealtimeIndicator', () => ({
  RealtimeIndicator: () => <div data-testid="realtime-indicator" />,
}));

describe('RealtimeDashboard', () => {
  it('renders children', () => {
    render(
      <RealtimeDashboard>
        <div data-testid="child-content">Dashboard Content</div>
      </RealtimeDashboard>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders RealtimeIndicator', () => {
    render(
      <RealtimeDashboard>
        <div>Content</div>
      </RealtimeDashboard>
    );
    expect(screen.getByTestId('realtime-indicator')).toBeInTheDocument();
  });
});
