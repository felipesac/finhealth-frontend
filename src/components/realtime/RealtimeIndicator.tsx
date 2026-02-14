'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  lastEvent: string | null;
  className?: string;
}

export function RealtimeIndicator({ lastEvent, className }: RealtimeIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastEvent) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  if (!visible) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400 transition-opacity',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      Atualizado
    </span>
  );
}
