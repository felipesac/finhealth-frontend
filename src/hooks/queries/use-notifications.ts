'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

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

const fetchNotifications = async (): Promise<NotificationsResponse> => {
  const res = await fetch('/api/notifications');
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
};

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: fetchNotifications,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id?: string; markAllRead?: boolean }) => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all() });
      const prev = queryClient.getQueryData<NotificationsResponse>(queryKeys.notifications.all());

      if (prev) {
        const updated = payload.markAllRead
          ? { data: prev.data.map((n) => ({ ...n, read: true })), unreadCount: 0 }
          : {
              data: prev.data.map((n) => (n.id === payload.id ? { ...n, read: true } : n)),
              unreadCount: Math.max(0, prev.unreadCount - 1),
            };
        queryClient.setQueryData(queryKeys.notifications.all(), updated);
      }

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.notifications.all(), context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });
}
