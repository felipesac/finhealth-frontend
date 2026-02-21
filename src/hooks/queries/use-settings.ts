'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

interface TissSettings {
  tiss_version: string;
  cnes: string;
}

interface NotificationPreferences {
  email_glosas: boolean;
  email_pagamentos: boolean;
  email_contas: boolean;
  push_enabled: boolean;
}

const fetchTissSettings = async (): Promise<TissSettings> => {
  const res = await fetch('/api/settings/tiss');
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? { tiss_version: '3.05.00', cnes: '' };
};

const fetchNotifPrefs = async (): Promise<NotificationPreferences> => {
  const res = await fetch('/api/notifications/preferences');
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? { email_glosas: true, email_pagamentos: true, email_contas: false, push_enabled: false };
};

export function useTissSettings() {
  return useQuery({
    queryKey: queryKeys.settings.tiss(),
    queryFn: fetchTissSettings,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.settings.notificationPrefs(),
    queryFn: fetchNotifPrefs,
  });
}

export function useUpdateTissSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TissSettings) => {
      const res = await fetch('/api/settings/tiss', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.tiss() });
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      return res.json();
    },
    onSuccess: (_data, prefs) => {
      queryClient.setQueryData(queryKeys.settings.notificationPrefs(), prefs);
    },
  });
}
