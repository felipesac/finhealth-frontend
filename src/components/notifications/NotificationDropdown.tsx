'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Check, AlertCircle, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatRelative } from '@/lib/formatters';
import { useSWRFetch } from '@/hooks/useSWRFetch';

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  href: string | null;
  created_at: string;
}

interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
}

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle2,
};

export function NotificationDropdown() {
  const router = useRouter();
  const { data, mutate } = useSWRFetch<NotificationsResponse>('/api/notifications', {
    refreshInterval: 60000,
  });

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markAsRead = async (id: string) => {
    mutate(
      { data: notifications.map((n) => (n.id === id ? { ...n, read: true } : n)), unreadCount: Math.max(0, unreadCount - 1) },
      false,
    );
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    mutate();
  };

  const markAllRead = async () => {
    mutate(
      { data: notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 },
      false,
    );
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    mutate();
  };

  const handleClick = (notification: Notification) => {
    if (!notification.read) markAsRead(notification.id);
    if (notification.href) router.push(notification.href);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notificacoes${unreadCount > 0 ? `, ${unreadCount} nao lidas` : ''}`}>
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
              aria-hidden="true"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificacoes</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={markAllRead}>
              <Check className="mr-1 h-3 w-3" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground" role="status">
            Nenhuma notificacao
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => {
            const Icon = typeIcons[notification.type] || Info;
            return (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                onClick={() => handleClick(notification)}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <p className={`text-sm leading-tight ${!notification.read ? 'font-medium' : ''}`}>
                    {notification.title}
                  </p>
                  {notification.message && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatRelative(notification.created_at)}</p>
                </div>
                {!notification.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
