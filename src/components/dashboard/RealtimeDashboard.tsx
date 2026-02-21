'use client';

import { useRouter } from 'next/navigation';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { RealtimeIndicator } from '@/components/realtime/RealtimeIndicator';
import { useState, useCallback } from 'react';

interface RealtimeDashboardProps {
  children: React.ReactNode;
}

export function RealtimeDashboard({ children }: RealtimeDashboardProps) {
  const router = useRouter();
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const handleChange = useCallback(() => {
    setLastEvent(Date.now().toString());
    router.refresh();
  }, [router]);

  // Subscribe to changes on key tables
  useRealtimeSubscription(
    { table: 'medical_accounts', event: '*' },
    handleChange
  );

  useRealtimeSubscription(
    { table: 'glosas', event: '*' },
    handleChange
  );

  useRealtimeSubscription(
    { table: 'payments', event: '*' },
    handleChange
  );

  return (
    <div className="relative">
      <div className="absolute right-0 top-0 z-10">
        <RealtimeIndicator lastEvent={lastEvent} />
      </div>
      {children}
    </div>
  );
}
