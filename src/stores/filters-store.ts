import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccountStatus, AccountType, AppealStatus } from '@/types';

interface FiltersState {
  accounts: {
    status: AccountStatus | 'all';
    type: AccountType | 'all';
    insurerId: string | 'all';
    search: string;
  };
  glosas: {
    appealStatus: AppealStatus | 'all';
    type: string | 'all';
    insurerId: string | 'all';
  };
  setAccountFilters: (filters: Partial<FiltersState['accounts']>) => void;
  setGlosaFilters: (filters: Partial<FiltersState['glosas']>) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  accounts: {
    status: 'all' as const,
    type: 'all' as const,
    insurerId: 'all' as const,
    search: '',
  },
  glosas: {
    appealStatus: 'all' as const,
    type: 'all' as const,
    insurerId: 'all' as const,
  },
};

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      ...defaultFilters,
      setAccountFilters: (filters) =>
        set((state) => ({
          accounts: { ...state.accounts, ...filters },
        })),
      setGlosaFilters: (filters) =>
        set((state) => ({
          glosas: { ...state.glosas, ...filters },
        })),
      resetFilters: () => set(defaultFilters),
    }),
    {
      name: 'finhealth-filters',
    }
  )
);
