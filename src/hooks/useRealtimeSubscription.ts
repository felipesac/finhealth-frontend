'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

interface UseRealtimeOptions {
  table: string;
  schema?: string;
  event?: PostgresChangeEvent | '*';
  filter?: string;
  enabled?: boolean;
}

/**
 * Subscribe to Supabase Realtime changes on a table.
 * Calls `onData` whenever a matching change occurs.
 */
export function useRealtimeSubscription<T extends Record<string, unknown>>(
  options: UseRealtimeOptions,
  onData: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  const { table, schema = 'public', event = '*', filter, enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    const supabase = createClient();

    const channelName = `realtime-${table}-${event}-${filter || 'all'}`;

    const channelConfig: Record<string, unknown> = {
      event,
      schema,
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as never,
        channelConfig as never,
        (payload: RealtimePostgresChangesPayload<T>) => {
          onDataRef.current(payload);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return cleanup;
  }, [table, schema, event, filter, enabled, cleanup]);

  return { unsubscribe: cleanup };
}
