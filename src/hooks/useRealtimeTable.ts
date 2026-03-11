'use client';

import { useState, useCallback } from 'react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseRealtimeTableOptions {
  table: string;
  enabled?: boolean;
}

/**
 * Maintains a local array of records that automatically syncs with
 * Supabase Realtime INSERT/UPDATE/DELETE events.
 */
export function useRealtimeTable<T extends { id: string }>(
  initialData: T[],
  options: UseRealtimeTableOptions
) {
  const [data, setData] = useState<T[]>(initialData);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<T & Record<string, unknown>>) => {
      const eventType = payload.eventType;
      setLastEvent(eventType);

      if (eventType === 'INSERT') {
        const newRecord = payload.new as T;
        setData((prev) => [newRecord, ...prev]);
      } else if (eventType === 'UPDATE') {
        const updated = payload.new as T;
        setData((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      } else if (eventType === 'DELETE') {
        const deleted = payload.old as { id: string };
        setData((prev) => prev.filter((item) => item.id !== deleted.id));
      }
    },
    []
  );

  useRealtimeSubscription<T & Record<string, unknown>>(
    { table: options.table, event: '*', enabled: options.enabled ?? true },
    handleChange
  );

  return { data, setData, lastEvent };
}
