import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

interface Patient {
  id: string;
  name: string;
  cpf: string | null;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

interface PatientsResponse {
  success: boolean;
  data: Patient[];
  pagination: {
    totalPages: number;
    page: number;
    limit: number;
    total: number;
  };
}

interface CreatePatientPayload {
  name: string;
  cpf?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
}

export function usePatients(page: number, search?: string) {
  return useQuery<PatientsResponse>({
    queryKey: queryKeys.patients.list(page, search),
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/patients?${params}`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePatientPayload) => {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create patient');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all() });
    },
  });
}
