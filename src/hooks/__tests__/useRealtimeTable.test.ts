import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRealtimeTable } from '../useRealtimeTable';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

let capturedCallback: ((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) | null = null;

vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useRealtimeSubscription: (
    _opts: Record<string, unknown>,
    cb: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  ) => {
    capturedCallback = cb;
    return { unsubscribe: vi.fn() };
  },
}));

interface TestRecord {
  id: string;
  name: string;
}

const initialData: TestRecord[] = [
  { id: '1', name: 'First' },
  { id: '2', name: 'Second' },
];

beforeEach(() => {
  capturedCallback = null;
  vi.clearAllMocks();
});

describe('useRealtimeTable', () => {
  it('returns initial data', () => {
    const { result } = renderHook(() =>
      useRealtimeTable(initialData, { table: 'items' })
    );

    expect(result.current.data).toEqual(initialData);
    expect(result.current.lastEvent).toBeNull();
  });

  it('handles INSERT events by prepending', () => {
    const { result } = renderHook(() =>
      useRealtimeTable(initialData, { table: 'items' })
    );

    act(() => {
      capturedCallback?.({
        eventType: 'INSERT',
        new: { id: '3', name: 'Third' },
        old: {},
        schema: 'public',
        table: 'items',
        commit_timestamp: '',
        errors: null,
      } as unknown as RealtimePostgresChangesPayload<Record<string, unknown>>);
    });

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data[0]).toEqual({ id: '3', name: 'Third' });
    expect(result.current.lastEvent).toBe('INSERT');
  });

  it('handles UPDATE events by merging', () => {
    const { result } = renderHook(() =>
      useRealtimeTable(initialData, { table: 'items' })
    );

    act(() => {
      capturedCallback?.({
        eventType: 'UPDATE',
        new: { id: '1', name: 'Updated First' },
        old: { id: '1' },
        schema: 'public',
        table: 'items',
        commit_timestamp: '',
        errors: null,
      } as unknown as RealtimePostgresChangesPayload<Record<string, unknown>>);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].name).toBe('Updated First');
    expect(result.current.lastEvent).toBe('UPDATE');
  });

  it('handles DELETE events by filtering', () => {
    const { result } = renderHook(() =>
      useRealtimeTable(initialData, { table: 'items' })
    );

    act(() => {
      capturedCallback?.({
        eventType: 'DELETE',
        new: {},
        old: { id: '2' },
        schema: 'public',
        table: 'items',
        commit_timestamp: '',
        errors: null,
      } as unknown as RealtimePostgresChangesPayload<Record<string, unknown>>);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].id).toBe('1');
    expect(result.current.lastEvent).toBe('DELETE');
  });

  it('exposes setData for manual updates', () => {
    const { result } = renderHook(() =>
      useRealtimeTable(initialData, { table: 'items' })
    );

    act(() => {
      result.current.setData([{ id: '99', name: 'Manual' }]);
    });

    expect(result.current.data).toEqual([{ id: '99', name: 'Manual' }]);
  });
});
