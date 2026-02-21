'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { MedicalAccount } from '@/types';

interface AccountsListResponse {
  success: boolean;
  data: MedicalAccount[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface AccountFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export function useAccounts(orgId: string, filters?: AccountFilters) {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();

  return useQuery({
    queryKey: queryKeys.accounts.list(orgId, filters),
    queryFn: async (): Promise<AccountsListResponse> => {
      const res = await fetch(`/api/accounts${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    },
    enabled: !!orgId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useAccount(orgId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(orgId, id),
    queryFn: async (): Promise<MedicalAccount> => {
      const res = await fetch(`/api/accounts/${id}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!orgId && !!id,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreateAccount(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.metrics(orgId) });
    },
  });
}
