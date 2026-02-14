export const queryKeys = {
  accounts: {
    all: (orgId: string) => ['accounts', orgId] as const,
    list: (orgId: string, filters?: object) =>
      ['accounts', orgId, 'list', filters] as const,
    detail: (orgId: string, id: string) =>
      ['accounts', orgId, 'detail', id] as const,
  },
  glosas: {
    all: (orgId: string) => ['glosas', orgId] as const,
    list: (orgId: string, filters?: object) =>
      ['glosas', orgId, 'list', filters] as const,
    detail: (orgId: string, id: string) =>
      ['glosas', orgId, 'detail', id] as const,
  },
  payments: {
    all: (orgId: string) => ['payments', orgId] as const,
    list: (orgId: string, filters?: object) =>
      ['payments', orgId, 'list', filters] as const,
    detail: (orgId: string, id: string) =>
      ['payments', orgId, 'detail', id] as const,
  },
  dashboard: {
    metrics: (orgId: string) => ['dashboard', orgId, 'metrics'] as const,
  },
  users: {
    all: () => ['users'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  notifications: {
    all: () => ['notifications'] as const,
  },
  settings: {
    tiss: () => ['settings', 'tiss'] as const,
    notificationPrefs: () => ['settings', 'notification-prefs'] as const,
  },
};
