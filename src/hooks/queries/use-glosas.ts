'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { Glosa } from '@/types';

interface GlosasListResponse {
  success: boolean;
  data: Glosa[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface GlosaFilters {
  page?: number;
  limit?: number;
  appeal_status?: string;
  medical_account_id?: string;
}

export function useGlosas(orgId: string, filters?: GlosaFilters) {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.appeal_status) params.set('appeal_status', filters.appeal_status);
  if (filters?.medical_account_id) params.set('medical_account_id', filters.medical_account_id);
  const qs = params.toString();

  return useQuery({
    queryKey: queryKeys.glosas.list(orgId, filters),
    queryFn: async (): Promise<GlosasListResponse> => {
      const res = await fetch(`/api/glosas${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    },
    enabled: !!orgId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useGlosa(orgId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.glosas.detail(orgId, id),
    queryFn: async (): Promise<Glosa> => {
      const res = await fetch(`/api/glosas/${id}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!orgId && !!id,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreateGlosa(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/glosas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.glosas.all(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.metrics(orgId) });
    },
  });
}
