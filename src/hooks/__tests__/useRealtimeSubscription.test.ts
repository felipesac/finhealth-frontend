import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRealtimeSubscription } from '../useRealtimeSubscription';

const mockUnsubscribe = vi.fn();

function createMockChannel() {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: mockUnsubscribe,
  };
  return channel;
}

let latestChannel: ReturnType<typeof createMockChannel>;
const mockChannelFn = vi.fn(() => {
  latestChannel = createMockChannel();
  return latestChannel;
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: mockChannelFn,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useRealtimeSubscription', () => {
  it('subscribes to a table channel', () => {
    const callback = vi.fn();
    renderHook(() => useRealtimeSubscription({ table: 'accounts' }, callback));

    expect(mockChannelFn).toHaveBeenCalledWith('realtime-accounts-*-all');
    expect(latestChannel.on).toHaveBeenCalled();
    expect(latestChannel.subscribe).toHaveBeenCalled();
  });

  it('includes event and filter in channel name', () => {
    const callback = vi.fn();
    renderHook(() =>
      useRealtimeSubscription(
        { table: 'glosas', event: 'INSERT', filter: 'org_id=eq.123' },
        callback
      )
    );

    expect(mockChannelFn).toHaveBeenCalledWith('realtime-glosas-INSERT-org_id=eq.123');
  });

  it('does not subscribe when enabled is false', () => {
    const callback = vi.fn();
    renderHook(() =>
      useRealtimeSubscription({ table: 'accounts', enabled: false }, callback)
    );

    expect(mockChannelFn).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() =>
      useRealtimeSubscription({ table: 'payments' }, callback)
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('returns unsubscribe function', () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useRealtimeSubscription({ table: 'accounts' }, callback)
    );

    expect(result.current.unsubscribe).toBeTypeOf('function');
  });
});
