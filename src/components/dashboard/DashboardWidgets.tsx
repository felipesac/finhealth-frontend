'use client';

import { useDashboardStore } from '@/stores/dashboard-store';
import type { ReactNode } from 'react';

interface DashboardWidgetsProps {
  widgetMap: Record<string, ReactNode>;
}

export function DashboardWidgets({ widgetMap }: DashboardWidgetsProps) {
  const { widgets } = useDashboardStore();

  return (
    <>
      {widgets
        .filter((w) => w.visible && widgetMap[w.id])
        .map((w) => (
          <div key={w.id}>{widgetMap[w.id]}</div>
        ))}
    </>
  );
}
