'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { Payment } from '@/types';

interface PaymentsListResponse {
  success: boolean;
  data: Payment[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface PaymentFilters {
  page?: number;
  limit?: number;
  reconciliation_status?: string;
  search?: string;
}

export function usePayments(orgId: string, filters?: PaymentFilters) {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.reconciliation_status) params.set('reconciliation_status', filters.reconciliation_status);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();

  return useQuery({
    queryKey: queryKeys.payments.list(orgId, filters),
    queryFn: async (): Promise<PaymentsListResponse> => {
      const res = await fetch(`/api/payments${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    },
    enabled: !!orgId,
  });
}

export function usePayment(orgId: string, id: string) {
  return useQuery({
    queryKey: queryKeys.payments.detail(orgId, id),
    queryFn: async (): Promise<Payment> => {
      const res = await fetch(`/api/payments/${id}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!orgId && !!id,
  });
}

export function useCreatePayment(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.metrics(orgId) });
    },
  });
}
