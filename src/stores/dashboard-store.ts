import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DashboardWidget {
  id: string;
  label: string;
  visible: boolean;
}

const defaultWidgets: DashboardWidget[] = [
  { id: 'metrics', label: 'Metricas', visible: true },
  { id: 'charts', label: 'Graficos', visible: true },
  { id: 'glosas-chart', label: 'Grafico de Glosas', visible: true },
  { id: 'recent-accounts', label: 'Contas Recentes', visible: true },
  { id: 'quick-actions', label: 'Acoes Rapidas', visible: true },
];

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

interface DashboardStore {
  widgets: DashboardWidget[];
  toggleWidget: (id: string) => void;
  moveWidget: (fromIndex: number, toIndex: number) => void;
  resetWidgets: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      widgets: defaultWidgets,
      toggleWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, visible: !w.visible } : w
          ),
        })),
      moveWidget: (fromIndex, toIndex) =>
        set((state) => {
          const widgets = [...state.widgets];
          const [moved] = widgets.splice(fromIndex, 1);
          widgets.splice(toIndex, 0, moved);
          return { widgets };
        }),
      resetWidgets: () => set({ widgets: defaultWidgets }),
    }),
    {
      name: 'finhealth-dashboard',
      version: 1,
      storage: createJSONStorage(safeLocalStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const valid = Array.isArray(state.widgets) &&
          state.widgets.every((w) => w && typeof w.id === 'string' && typeof w.visible === 'boolean');
        if (!valid) {
          state.widgets = defaultWidgets;
        }
      },
    }
  )
);
