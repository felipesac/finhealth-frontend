import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const safeLocalStorage = () => {
  const storage: Storage = {
    length: 0,
    clear: () => { /* noop */ },
    key: () => null,
    getItem: (name: string) => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        localStorage.setItem(name, value);
      } catch {
        // Safari private mode or quota exceeded
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name);
      } catch {
        // ignore
      }
    },
  };
  return storage;
};

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'finhealth-ui',
      version: 1,
      storage: createJSONStorage(safeLocalStorage),
    }
  )
);
